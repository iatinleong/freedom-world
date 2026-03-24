import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 查詢訂單狀態（用 service role key 繞過 RLS）
async function getOrderStatus(merchantOrderNo: string): Promise<'SUCCESS' | 'PENDING' | 'FAILED' | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return null;

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('merchant_order_no', merchantOrderNo)
        .single();
    return (data?.status as 'SUCCESS' | 'PENDING' | 'FAILED') ?? null;
}

function buildRedirect(req: Request, status: 'success' | 'pending' | 'failed') {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
    return NextResponse.redirect(`${baseUrl}/game?payment=${status}`, 302);
}

async function handleReturn(req: Request) {
    const orderNo = new URL(req.url).searchParams.get('order');

    if (orderNo) {
        const status = await getOrderStatus(orderNo);
        if (status === 'SUCCESS') return buildRedirect(req, 'success');
        if (status === 'FAILED') return buildRedirect(req, 'failed');
    }

    // webhook 尚未到達，或查不到訂單 → 顯示「確認中」
    return buildRedirect(req, 'pending');
}

export async function GET(req: Request) {
    return handleReturn(req);
}

export async function POST(req: Request) {
    return handleReturn(req);
}
