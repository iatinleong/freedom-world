import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMerchantId, checkNewebPayConfig } from '@/lib/newebpay';

// 生成藍新單筆查詢專用的 CheckValue
function createQueryCheckValue(amt: string, merchantOrderNo: string) {
    const HASH_KEY = process.env.NEWEBPAY_HASH_KEY || '';
    const HASH_IV = process.env.NEWEBPAY_HASH_IV || '';
    const MERCHANT_ID = getMerchantId();

    // 根據藍新文件 [4.1.6 CheckValue]，查詢 API 專用的規則：
    // 參數 Amt, MerchantID, MerchantOrderNo 照英文字母 A~Z 排序
    // 即：Amt -> MerchantID -> MerchantOrderNo
    const checkString = `IV=${HASH_IV}&Amt=${amt}&MerchantID=${MERCHANT_ID}&MerchantOrderNo=${merchantOrderNo}&Key=${HASH_KEY}`;
    
    // 使用 SHA256 壓碼後轉大寫
    const checkValue = crypto.createHash('sha256').update(checkString).digest('hex').toUpperCase();
    return checkValue;
}

export async function POST(req: Request) {
    if (!checkNewebPayConfig()) {
        return NextResponse.json({ error: '金流設定未完成' }, { status: 500 });
    }

    try {
        const { merchantOrderNo, amount } = await req.json();

        if (!merchantOrderNo || !amount) {
            return NextResponse.json({ error: '缺少必要參數' }, { status: 400 });
        }

        const checkValue = createQueryCheckValue(amount.toString(), merchantOrderNo);
        
        // 準備送給藍新的 Form Post 資料
        const formData = new URLSearchParams();
        formData.append('MerchantID', getMerchantId());
        formData.append('Version', '1.3'); // 查詢 API 版本為 1.3
        formData.append('RespondType', 'JSON');
        formData.append('CheckValue', checkValue);
        formData.append('TimeStamp', Math.floor(Date.now() / 1000).toString());
        formData.append('MerchantOrderNo', merchantOrderNo);
        formData.append('Amt', amount.toString());

        // 依據環境變數或預設值決定發送網址
        const apiUrl = process.env.NEXT_PUBLIC_NEWEBPAY_URL || 'https://core.newebpay.com/API/QueryTradeInfo';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        const data = await response.json();
        
        return NextResponse.json(data);

    } catch (error) {
        console.error('Query API error:', error);
        return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }
}
