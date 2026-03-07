'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StorePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async (planId: string) => {
        setLoading(true);
        setError(null);

        try {
            // 1. 呼叫後端 API 取得加密結帳參數
            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '結帳發起失敗');
            }

            // 2. 建立隱藏表單並自動送出 (POST 導向至藍新金流)
            // 透過環境變數決定要打正式區還是測試區，預設為正式區
            const actionUrl = process.env.NEXT_PUBLIC_NEWEBPAY_URL || 'https://core.newebpay.com/MPG/mpg_gateway'; 
            
            
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = actionUrl;
            form.style.display = 'none';

            // 將 API 回傳的參數轉為 hidden input 塞入 form 中
            const fields = {
                MerchantID: data.MerchantID,
                TradeInfo: data.TradeInfo,
                TradeSha: data.TradeSha,
                Version: data.Version,
            };

            for (const [key, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit(); // 自動送出表單跳轉

        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center text-amber-500">黑市商人</h1>
                <p className="text-center mb-12 text-neutral-400">「少俠，想要在江湖走得長遠，盤纏是少不了的...」</p>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md mb-8 text-center">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 旅者方案 */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col items-center hover:border-amber-700 transition-colors">
                        <h2 className="text-2xl font-bold mb-2">旅者方案</h2>
                        <div className="text-3xl text-amber-500 font-bold mb-4">$8 <span className="text-sm text-neutral-500">/ 月</span></div>
                        <ul className="text-neutral-400 space-y-2 mb-8 flex-grow">
                            <li>每日 60 次生成額度</li>
                            <li>(約 TWD 240)</li>
                        </ul>
                        <button 
                            onClick={() => handleCheckout('WANDERER')}
                            disabled={loading}
                            className="w-full bg-neutral-800 hover:bg-neutral-700 text-amber-500 font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? '準備中...' : '購買旅者方案'}
                        </button>
                    </div>

                    {/* 說書人方案 */}
                    <div className="bg-neutral-900 border border-amber-600 rounded-lg p-6 flex flex-col items-center transform md:-translate-y-4 shadow-lg shadow-amber-900/20">
                        <div className="bg-amber-600 text-black text-xs font-bold px-3 py-1 rounded-full -mt-10 mb-4">最推薦</div>
                        <h2 className="text-2xl font-bold mb-2">說書人方案</h2>
                        <div className="text-3xl text-amber-500 font-bold mb-4">$18 <span className="text-sm text-neutral-500">/ 月</span></div>
                        <ul className="text-neutral-400 space-y-2 mb-8 flex-grow">
                            <li>每日 180 次生成額度</li>
                            <li>支援最新進階模型</li>
                            <li>(約 TWD 540)</li>
                        </ul>
                        <button 
                            onClick={() => handleCheckout('STORYTELLER')}
                            disabled={loading}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? '準備中...' : '購買說書人方案'}
                        </button>
                    </div>

                    {/* 篇章補充包 */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col items-center hover:border-amber-700 transition-colors">
                        <h2 className="text-2xl font-bold mb-2">篇章補充包</h2>
                        <div className="text-3xl text-amber-500 font-bold mb-4">$4.99 <span className="text-sm text-neutral-500">/ 次</span></div>
                        <ul className="text-neutral-400 space-y-2 mb-8 flex-grow">
                            <li>一次性 300 次生成額度</li>
                            <li>永久有效，優先扣除</li>
                            <li>(約 TWD 150)</li>
                        </ul>
                        <button 
                            onClick={() => handleCheckout('ADDON')}
                            disabled={loading}
                            className="w-full bg-neutral-800 hover:bg-neutral-700 text-amber-500 font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? '準備中...' : '購買補充包'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
