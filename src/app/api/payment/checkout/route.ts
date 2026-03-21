import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';
import { encryptTradeInfo, createTradeSha, getMerchantId, checkNewebPayConfig } from '@/lib/newebpay';

// 假設方案價格 (未來可以移到資料庫或設定檔)
const PLANS = {
    WANDERER: { amount: 240, desc: '旅者方案 (1個月)' },     // $8 USD 約等於 240 TWD
    STORYTELLER: { amount: 540, desc: '說書人方案 (1個月)' }, // $18 USD 約等於 540 TWD
    ADDON: { amount: 150, desc: '篇章補充包 (300回合)' },     // $4.99 USD 約等於 150 TWD
    TEST_5: { amount: 5, desc: '測試補充包 (50回合)' },       // $5 TWD
    TEST_10: { amount: 10, desc: '10元測試包 (100回合)' },    // $10 TWD
};

export async function POST(req: Request) {
    if (!checkNewebPayConfig()) {
        return NextResponse.json({ error: '金流設定未完成，請聯絡系統管理員。' }, { status: 500 });
    }

    try {
        const { planId } = await req.json();
        
        // 1. 驗證方案
        if (!planId || !PLANS[planId as keyof typeof PLANS]) {
             return NextResponse.json({ error: '無效的購買方案。' }, { status: 400 });
        }
        
        const selectedPlan = PLANS[planId as keyof typeof PLANS];
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        let userId = null;

        // 嘗試從 Header 讀取 Authorization token (由前端傳來)
        const authHeader = req.headers.get('Authorization');
        let token = '';
        if (authHeader) {
            token = authHeader.replace('Bearer ', '');
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (user) {
                userId = user.id;
            }
        }

        if (!userId) {
             return NextResponse.json({ error: '請先登入。' }, { status: 401 });
        }

        // 為了確保寫入成功，後端 API 優先使用 Service Role Key 來建立訂單 (繞過 RLS)
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = supabaseServiceKey 
            ? createClient(supabaseUrl, supabaseServiceKey)
            : createClient(supabaseUrl, supabaseKey, {
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            });

        // 2. 建立訂單 (寫入 Supabase)
        const merchantOrderNo = `FW_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        const { error: insertError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId,
                merchant_order_no: merchantOrderNo,
                amount: selectedPlan.amount,
                item_desc: selectedPlan.desc,
                status: 'PENDING',
            });

        if (insertError) {
            console.error('建立訂單失敗:', insertError);
            return NextResponse.json({ error: `建立訂單失敗: ${insertError.message}` }, { status: 500 });
        }

        // 取得當前的 baseUrl (優先使用環境變數，否則使用請求的 origin，方便 Vercel Preview 測試)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

        // 3. 準備藍新金流 TradeInfo 參數
        const tradeInfoParams = {
            MerchantID: getMerchantId(),
            RespondType: 'JSON',
            TimeStamp: Math.floor(Date.now() / 1000).toString(),
            Version: '2.3', // 根據最新手冊更新為 2.3
            MerchantOrderNo: merchantOrderNo,
            Amt: selectedPlan.amount,
            ItemDesc: selectedPlan.desc,
            // 回傳網址
            ReturnURL: `${baseUrl}/api/payment/return`,
            NotifyURL: `${baseUrl}/api/payment/notify`,
            ClientBackURL: `${baseUrl}/store`, // 返回遊戲商店
            // PWA / 行動端體驗優化
            WalletDisplayMode: 0, // 0 = 根據用戶設備自動跳轉 APP (非強制顯示 QR code)
            TradeLimit: 900,      // 交易有效時間 15 分鐘 (900秒)
            // TokenTerm: session.user.email, // 暫不啟用記憶卡號，待訂閱制實作時開啟
        };

        // 4. 加密並產生 Sha
        const encryptedTradeInfo = encryptTradeInfo(tradeInfoParams);
        const tradeSha = createTradeSha(encryptedTradeInfo);

        // 5. 回傳給前端
        return NextResponse.json({
            MerchantID: getMerchantId(),
            TradeInfo: encryptedTradeInfo,
            TradeSha: tradeSha,
            Version: '2.3',
        });

    } catch (error) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: '伺服器內部錯誤' }, { status: 500 });
    }
}