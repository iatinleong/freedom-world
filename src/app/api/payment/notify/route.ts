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
                    .eq('merchant_order_no', MerchantOrderNo)
                    .eq('status', 'PENDING'); // 只從 PENDING 轉失敗，避免覆蓋已成功訂單
            }

            return NextResponse.json({ status: 'Payment Failed Received' });
        }

        // 3. 先查出訂單（取得 user_id 和 item_desc）
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, item_desc, status')
            .eq('merchant_order_no', MerchantOrderNo)
            .single();

        if (orderError || !order) {
            console.error('Order not found:', MerchantOrderNo);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 4. 先執行額度增加 (increment_quota)
        // 如果失敗，回傳 500 讓藍新金流稍後 retry。
        // 如果成功，才往下走把訂單改為 SUCCESS。
        let turnsToAdd = 0;
        if (order.item_desc.includes('旅者')) turnsToAdd = 60;
        else if (order.item_desc.includes('說書人')) turnsToAdd = 180;
        else if (order.item_desc.includes('5元測試包')) turnsToAdd = 10;
        else if (order.item_desc.includes('1元測試包')) turnsToAdd = 1;
        else if (order.item_desc.includes('補充包')) turnsToAdd = 300;

        if (turnsToAdd > 0) {
            // 使用 RPC 進行原子加總
            const { error: incrementError } = await supabaseAdmin.rpc('increment_quota', {
                p_user_id: order.user_id,
                p_turns: turnsToAdd
            });

            if (incrementError) {
                console.error(`Failed to increment quota for user ${order.user_id}:`, incrementError);
                // 額度增加失敗，中斷處理並回傳 500，這會讓藍新進入 Retry 隊列。
                // 由於還沒跑到下一步的 update，訂單狀態依然會是 PENDING。
                return NextResponse.json({ error: 'Failed to update quota' }, { status: 500 });
            }
            console.log(`Added ${turnsToAdd} turns to user ${order.user_id}`);
        }

        // 5. 條件更新：只有 status='PENDING' 的訂單才能轉為 SUCCESS
        //    這是防止 webhook 重送或並發時重複入帳的關鍵原子操作 (CAS)
        const { data: updatedRows, error: updateError } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'SUCCESS',
                trade_no: resultObj?.TradeNo,
                payment_type: resultObj?.PaymentType,
                pay_time: resultObj?.PayTime
            })
            .eq('id', order.id)
            .eq('status', 'PENDING') // 只有 PENDING 才能轉成功
            .select('id');

        if (updateError) {
            console.error('Failed to update order status:', updateError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 如果沒有任何列被更新，代表另一個 webhook 已搶先處理完。
        if (!updatedRows || updatedRows.length === 0) {
            console.log(`Order ${MerchantOrderNo} already processed by another request.`);
            return NextResponse.json({ status: 'Already processed' });
        }

        // 藍新要求背景通知必須回傳 HTTP 200，它才不會一直 retry
        return NextResponse.json({ status: 'OK' });

    } catch (error) {
        console.error('Notify API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
