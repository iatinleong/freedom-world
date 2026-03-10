import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PolicyPage() {
    return (
        <main className="min-h-screen bg-wuxia-ink-blue text-white/80 p-6 sm:p-12 font-serif selection:bg-wuxia-gold/30">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center text-wuxia-gold/70 hover:text-wuxia-gold transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回客棧
                </Link>

                <h1 className="text-4xl font-bold text-wuxia-gold mb-12 tracking-widest text-center ancient-title border-b border-wuxia-gold/20 pb-6">自由江湖 - 服務條款與政策</h1>

                <div className="space-y-12 text-sm sm:text-base leading-relaxed tracking-wide">
                    
                    {/* 服務條款 */}
                    <section className="bg-black/40 p-8 rounded-lg border border-white/5 shadow-xl">
                        <h2 className="text-2xl text-wuxia-gold mb-4 border-l-4 border-wuxia-vermillion pl-4">一、服務條款 (Terms of Service)</h2>
                        <ul className="list-disc list-inside space-y-3 pl-4 text-white/70">
                            <li><strong>接受條款：</strong>當您使用《自由江湖》（以下簡稱本網站/本遊戲）之服務，即表示您已閱讀、瞭解並同意接受本服務條款之所有內容。</li>
                            <li><strong>服務說明：</strong>本遊戲提供基於人工智慧生成之文字角色扮演遊戲體驗。玩家可透過購買「回合數」來推進遊戲劇情。</li>
                            <li><strong>帳號安全：</strong>玩家有責任妥善保管其登入憑證。任何經由該帳號發出之操作，皆視為玩家本人之行為。</li>
                            <li><strong>內容規範：</strong>遊戲內產生之所有 AI 文本內容，版權歸屬原 AI 模型提供商與本網站共同所有。玩家不得利用本服務進行非法、侵權、散布仇恨言論或違反善良風俗之行為。</li>
                            <li><strong>服務變更與終止：</strong>本網站保留隨時修改、暫停或終止服務之權利。若遇系統維護或不可抗力因素導致服務中斷，本網站將盡可能提前公告。</li>
                        </ul>
                    </section>

                    {/* 隱私權政策 */}
                    <section className="bg-black/40 p-8 rounded-lg border border-white/5 shadow-xl">
                        <h2 className="text-2xl text-wuxia-gold mb-4 border-l-4 border-wuxia-vermillion pl-4">二、隱私權政策 (Privacy Policy)</h2>
                        <ul className="list-disc list-inside space-y-3 pl-4 text-white/70">
                            <li><strong>資料蒐集：</strong>為提供遊戲服務與金流結帳功能，我們可能會蒐集您的電子郵件信箱、遊戲內日誌紀錄、第三方登入授權資訊，以及 IP 位址。</li>
                            <li><strong>資料使用：</strong>所蒐集之資料僅用於維護遊戲體驗、身分驗證、訂單處理（如藍新金流）、客戶服務及內部數據分析，絕不未經同意出售或洩漏予第三方（除法律要求外）。</li>
                            <li><strong>金流安全：</strong>本遊戲之線上交易皆透過「藍新金流 (NewebPay)」處理。您的信用卡資訊將由金流公司安全加密加密儲存，本網站不會記錄您的完整信用卡號。</li>
                            <li><strong>資料刪除：</strong>玩家可隨時聯絡客服要求刪除您的帳號與相關遊戲紀錄。</li>
                        </ul>
                    </section>

                    {/* 退款政策 */}
                    <section className="bg-black/40 p-8 rounded-lg border border-white/5 shadow-xl">
                        <h2 className="text-2xl text-wuxia-gold mb-4 border-l-4 border-wuxia-vermillion pl-4">三、退款政策 (Refund Policy)</h2>
                        <p className="mb-3 text-white/70">本服務屬「通訊交易解除權合理例外情事適用準則」中所規定之「非以有形媒介提供之數位內容或一經提供即為完成之線上服務」，因此：</p>
                        <ul className="list-disc list-inside space-y-3 pl-4 text-white/70">
                            <li><strong>數位商品不適用七天鑑賞期：</strong>由於購買之「遊戲回合數」屬於數位虛擬資產，一經付款成功且系統發放至玩家帳戶後，即視為服務已履行，<strong>原則上概不接受退款</strong>。</li>
                            <li><strong>例外退款情況：</strong>若因本系統嚴重故障導致您付款後超過 24 小時仍未獲得回合數，且我們無法為您補發時，請於購買日起 3 日內附上訂單編號與付款證明聯絡我們，我們將專案處理退款事宜。</li>
                            <li>退款手續費：若經核准退款，可能需扣除由金流平台（如信用卡公司）收取之交易手續費。</li>
                        </ul>
                    </section>

                    {/* 消費者權益與聯絡資訊 */}
                    <section className="bg-black/40 p-8 rounded-lg border border-white/5 shadow-xl">
                        <h2 className="text-2xl text-wuxia-gold mb-4 border-l-4 border-wuxia-vermillion pl-4">四、消費者權益與客服聯絡 (Customer Support)</h2>
                        <ul className="list-disc list-inside space-y-3 pl-4 text-white/70">
                            <li><strong>未成年人保護：</strong>若您為未成年人，請在法定代理人或監護人的同意下使用本服務並進行購買。</li>
                            <li><strong>交易安全：</strong>我們承諾提供安全的加密連線環境，保障您的交易與個人資訊。</li>
                            <li><strong>聯絡我們：</strong>若您有任何帳務、系統問題或申訴，請透過電子郵件與我們聯繫。我們將於收到信件後盡速為您處理。<br/>
                                <span className="text-wuxia-gold font-mono mt-2 inline-block">聯絡信箱：freedomworld1023@gmail.com | 客服專線：0989851023</span>
                            </li>
                        </ul>
                    </section>

                </div>
            </div>
        </main>
    );
}