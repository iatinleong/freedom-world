import { getSupabase } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import OrderRow from './OrderRow'; // We will create this client component

export default async function BillingPage() {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        redirect('/'); // 如果沒登入，導回首頁或登入頁
    }

    // 取得玩家的購買紀錄 (由新到舊)
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    // 取得玩家目前的可用額度
    const { data: quota } = await supabase
        .from('user_quotas')
        .select('turns_remaining')
        .eq('user_id', session.user.id)
        .single();

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-amber-500">帳務中心</h1>

                {/* 額度總覽區塊 */}
                <div className="bg-neutral-900 border border-amber-900/50 p-6 rounded-lg mb-8 shadow-lg shadow-amber-900/10">
                    <h2 className="text-xl text-neutral-400 mb-2">目前可用額度</h2>
                    <div className="text-4xl font-bold text-amber-400">
                        {quota?.turns_remaining || 0} <span className="text-xl text-neutral-500 font-normal">回合</span>
                    </div>
                </div>

                {/* 購買紀錄區塊 */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
                        <h2 className="text-xl font-semibold">歷史交易紀錄</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-neutral-500 border-b border-neutral-800 text-sm">
                                    <th className="p-4 font-medium">訂單編號</th>
                                    <th className="p-4 font-medium">項目</th>
                                    <th className="p-4 font-medium">金額</th>
                                    <th className="p-4 font-medium">狀態</th>
                                    <th className="p-4 font-medium">日期</th>
                                    <th className="p-4 font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {!orders || orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                                            尚無交易紀錄
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <OrderRow key={order.id} order={order} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}