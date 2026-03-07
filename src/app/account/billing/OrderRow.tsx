'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderRow({ order }: { order: any }) {
    const [isChecking, setIsChecking] = useState(false);
    const router = useRouter();

    const handleCheckStatus = async () => {
        setIsChecking(true);
        try {
            const res = await fetch('/api/payment/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    merchantOrderNo: order.merchant_order_no,
                    amount: order.amount
                }),
            });
            const data = await res.json();
            
            if (data.Status === 'SUCCESS') {
                const tradeStatus = data.Result.TradeStatus;
                if (tradeStatus === '1') {
                    alert('交易已成功！正在為您重新整理狀態與額度...');
                    // 因為狀態更新可能需要一點時間(如果是剛剛才補單成功)，
                    // 或是我們只是查詢，如果狀態是1但資料庫還沒更新，我們這裡可以簡單呼叫一個sync API
                    // 但最簡單的是先重新整理畫面
                    router.refresh();
                } else if (tradeStatus === '0') {
                    alert('此筆訂單尚未付款。');
                } else if (tradeStatus === '2') {
                    alert('此筆訂單交易失敗。');
                } else {
                     alert(`訂單狀態代碼: ${tradeStatus}`);
                }
            } else {
                alert(`查詢失敗: ${data.Message}`);
            }
        } catch (error) {
            console.error(error);
            alert('查詢過程發生錯誤');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <tr className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
            <td className="p-4 font-mono text-neutral-400 text-xs">{order.merchant_order_no}</td>
            <td className="p-4">{order.item_desc}</td>
            <td className="p-4">NT$ {order.amount}</td>
            <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'SUCCESS' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                    order.status === 'FAILED' ? 'bg-red-900/30 text-red-400 border border-red-800' :
                    'bg-amber-900/30 text-amber-400 border border-amber-800'
                }`}>
                    {order.status === 'SUCCESS' ? '交易成功' : 
                     order.status === 'FAILED' ? '交易失敗' : '等待付款'}
                </span>
            </td>
            <td className="p-4 text-neutral-500">
                {new Date(order.created_at).toLocaleString('zh-TW')}
            </td>
            <td className="p-4">
                {order.status === 'PENDING' && (
                    <button 
                        onClick={handleCheckStatus}
                        disabled={isChecking}
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-500 px-3 py-1 rounded border border-neutral-700 disabled:opacity-50 transition-colors"
                    >
                        {isChecking ? '查詢中...' : '查詢狀態'}
                    </button>
                )}
            </td>
        </tr>
    );
}
