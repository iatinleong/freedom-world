import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptTradeInfo, createTradeSha } from '@/lib/newebpay';

// NotifyURL 是在背景執行的，沒有使用者的登入 session
// 因此我們必須使用 Service Role Key 來擁有權限修改所有使用者的額度與訂單
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables for admin client');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const formData = await req.formData();
        const tradeInfo = formData.get('TradeInfo') as string;
        const tradeSha = formData.get('TradeSha') as string;

        if (!tradeInfo || !tradeSha) {
            console.error('NotifyURL error: Missing TradeInfo or TradeSha');
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. 驗證 SHA256 (確保資料是藍新傳來的，沒有被竄改)
        const expectedSha = createTradeSha(tradeInfo);
        if (expectedSha !== tradeSha) {
            console.error('NotifyURL error: Invalid TradeSha');
            return NextResponse.json({ error: 'Invalid SHA signature' }, { status: 400 });
        }

        // 2. 解密 TradeInfo
        const decryptedData = decryptTradeInfo(tradeInfo);
        console.log('Decrypted Notify Data:', decryptedData);
        
        // 藍新回傳的 Status 為 'SUCCESS' 才代表付款成功
        const { Status, Result } = decryptedData;
        const resultObj = typeof Result === 'string' ? JSON.parse(Result) : Result;
        const MerchantOrderNo = resultObj?.MerchantOrderNo;

        if (Status !== 'SUCCESS' || !MerchantOrderNo) {
            console.warn(`Payment failed or missing OrderNo. Status: ${Status}`);
            // 更新訂單為失敗
            if (MerchantOrderNo) {
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'FAILED' })
                    .eq('merchant_order_no', MerchantOrderNo);
            }
                
            return NextResponse.json({ status: 'Payment Failed Received' });
        }

        // 3. 處理付款成功邏輯
        // 先查出這筆訂單
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('merchant_order_no', MerchantOrderNo)
            .single();

        if (orderError || !order) {
            console.error('Order not found:', MerchantOrderNo);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 防呆：如果訂單已經是 SUCCESS，就不重複處理
        if (order.status === 'SUCCESS') {
            console.log(`Order ${MerchantOrderNo} already processed.`);
            return NextResponse.json({ status: 'Already processed' });
        }

        // 4. 更新訂單狀態與藍新交易序號
        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ 
                status: 'SUCCESS',
                trade_no: resultObj?.TradeNo,
                payment_type: resultObj?.PaymentType,
                pay_time: resultObj?.PayTime
            })
            .eq('id', order.id);

        if (updateError) {
             console.error('Failed to update order status:', updateError);
             return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 5. 增加玩家額度
        // 這裡需要根據你原本設定的方案邏輯去決定加多少額度
        let turnsToAdd = 0;
        if (order.item_desc.includes('旅者')) turnsToAdd = 60; // TODO: 根據方案代碼
        else if (order.item_desc.includes('說書人')) turnsToAdd = 180;
        else if (order.item_desc.includes('補充包')) turnsToAdd = 300;

        if (turnsToAdd > 0) {
             // 呼叫 Supabase 的 RPC (Stored Procedure) 或者使用 upsert 更新
             // 為了簡單起見，我們先查出來再加上去
             const { data: quota } = await supabaseAdmin
                .from('user_quotas')
                .select('turns_remaining')
                .eq('user_id', order.user_id)
                .single();

             const currentTurns = quota?.turns_remaining || 0;
             
             await supabaseAdmin
                .from('user_quotas')
                .upsert({ 
                    user_id: order.user_id, 
                    turns_remaining: currentTurns + turnsToAdd,
                    updated_at: new Date().toISOString()
                });
                
             console.log(`Added ${turnsToAdd} turns to user ${order.user_id}`);
        }

        // 藍新要求背景通知必須回傳 HTTP 200，它才不會一直 retry
        return NextResponse.json({ status: 'OK' });

    } catch (error) {
        console.error('Notify API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
