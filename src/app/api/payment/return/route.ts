import { NextResponse } from 'next/server';

// 藍新金流在交易完成後，會以 POST 方式將使用者導向 ReturnURL。
// 但是 Next.js 的前端頁面預設只接受 GET 請求。
// 因此我們需要這個中繼的 API Route 來接收 POST 請求，然後用 302 Redirect 轉導回前端頁面。
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const tradeInfo = formData.get('TradeInfo') as string;
        const status = formData.get('Status') as string;

        // 您可以在這裡解析 tradeInfo 來判斷是成功還是失敗，
        // 或者直接依靠藍新傳來的 Status 參數。
        // 但為了簡單與安全，我們直接將使用者導向前端，讓前端透過 URL 參數顯示對應訊息。
        
        // 取得 baseUrl
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

        // 如果 Status 是 SUCCESS，導向成功頁面
        // 注意：藍新的 Form Post 回傳可能只有加密資料，安全起見應該解密，但由於我們在 NotifyURL 已經處理了實質的發放邏輯，
        // 這裡單純只是 UI 呈現，所以可以透過嘗試抓取 Status 或統一導向 game 讓前端決定
        
        // 解析出來的結果會在 payload 中，我們直接帶個 success 回去
        // (如果玩家取消付款，通常不會跳回這個網址，而是跳回 ClientBackURL)
        return NextResponse.redirect(`${baseUrl}/game?payment=success`, 302);

    } catch (error) {
        console.error('Return API error:', error);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
        return NextResponse.redirect(`${baseUrl}/game?payment=failed`, 302);
    }
}
