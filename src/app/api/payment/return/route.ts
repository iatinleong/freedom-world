import { NextResponse } from 'next/server';

// 藍新金流在交易完成後，會以 POST 方式將使用者導向 ReturnURL。
// 真正的付款驗證與額度發放在 notify/route.ts（後端 webhook）完成。
// 這裡只是 UX 中繼：絕對不能在此宣告付款成功，改為導向帳務頁顯示「確認中」。
export async function GET(req: Request) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
    return NextResponse.redirect(`${baseUrl}/game?payment=pending`, 302);
}

export async function POST(req: Request) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
    // 一律導向帳務頁，讓用戶看到最新訂單狀態（由 notify webhook 非同步更新）
    return NextResponse.redirect(`${baseUrl}/game?payment=pending`, 302);
}
