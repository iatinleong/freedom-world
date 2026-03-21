import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getMerchantId, checkNewebPayConfig } from '@/lib/newebpay';

// 生成藍新單筆查詢專用的 CheckValue
function createQueryCheckValue(amt: string, merchantOrderNo: string) {
    const HASH_KEY = process.env.NEWEBPAY_HASH_KEY || '';
    const HASH_IV = process.env.NEWEBPAY_HASH_IV || '';
    const MERCHANT_ID = getMerchantId();

    // 根據藍新文件 [4.1.6 CheckValue]，查詢 API 專用的規則：
    // 參數 Amt, MerchantID, MerchantOrderNo 照英文字母 A~Z 排序
    const checkString = `IV=${HASH_IV}&Amt=${amt}&MerchantID=${MERCHANT_ID}&MerchantOrderNo=${merchantOrderNo}&Key=${HASH_KEY}`;
    return crypto.createHash('sha256').update(checkString).digest('hex').toUpperCase();
}

export async function POST(req: Request) {
    if (!checkNewebPayConfig()) {
        return NextResponse.json({ error: '金流設定未完成' }, { status: 500 });
    }

    // 1. 驗證登入身份
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
        return NextResponse.json({ error: '身份驗證失敗' }, { status: 401 });
    }

    try {
        const { merchantOrderNo } = await req.json();
        if (!merchantOrderNo) {
            return NextResponse.json({ error: '缺少訂單編號' }, { status: 400 });
        }

        // 2. 從 DB 查訂單，驗證 ownership（不信任前端提供的 amount）
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, amount, user_id, status')
            .eq('merchant_order_no', merchantOrderNo)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: '訂單不存在' }, { status: 404 });
        }
        if (order.user_id !== user.id) {
            return NextResponse.json({ error: '無權限查詢此訂單' }, { status: 403 });
        }

        // 3. 用 DB 的 amount 組 CheckValue（防止前端偽造金額）
        const checkValue = createQueryCheckValue(order.amount.toString(), merchantOrderNo);

        const formData = new URLSearchParams();
        formData.append('MerchantID', getMerchantId());
        formData.append('Version', '1.3');
        formData.append('RespondType', 'JSON');
        formData.append('CheckValue', checkValue);
        formData.append('TimeStamp', Math.floor(Date.now() / 1000).toString());
        formData.append('MerchantOrderNo', merchantOrderNo);
        formData.append('Amt', order.amount.toString());

        // 使用查單專屬 URL（NEXT_PUBLIC_NEWEBPAY_URL 是付款頁 MPG URL，兩者不同）
        const apiUrl = process.env.NEWEBPAY_QUERY_URL || 'https://core.newebpay.com/API/QueryTradeInfo';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        });

        const data = await response.json();

        // 4. 只回傳必要欄位，不透傳整個藍新回應
        return NextResponse.json({
            Status: data.Status,
            Message: data.Message,
            Result: data.Result ? {
                TradeStatus: data.Result.TradeStatus,
                PayTime: data.Result.PayTime,
            } : null,
        });

    } catch (error) {
        console.error('Query API error:', error);
        return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }
}
