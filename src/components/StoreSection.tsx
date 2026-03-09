'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanCardProps {
    planId: string;
    name: string;
    usdPrice: number;
    period: string;
    badge?: string;
    features: string[];
    highlight?: boolean;
    note?: string;
    rate: number | null;
    onCheckout: (planId: string) => void;
    isLoading: boolean;
}

function toTwd(usd: number, rate: number | null) {
    if (!rate) return '---';
    return `NT$${Math.round(usd * rate)}`;
}

function PlanCard({ planId, name, usdPrice, period, badge, features, highlight, note, rate, onCheckout, isLoading }: PlanCardProps) {
    const loadingRate = rate === null;
    return (
        <div className={`relative flex flex-col rounded-xl border p-7 transition-all duration-300
      ${highlight
                ? 'border-wuxia-gold bg-gradient-to-b from-wuxia-gold/10 to-transparent shadow-[0_0_40px_rgba(212,175,55,0.15)]'
                : 'border-white/15 bg-white/5 hover:border-white/30'}`}>
            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-wuxia-gold text-black text-xs font-bold rounded-full tracking-wider whitespace-nowrap">
                    {badge}
                </div>
            )}
            <div className="mb-6">
                <p className="text-sm text-white/50 tracking-widest uppercase font-mono mb-2">{name}</p>
                <div className="flex items-end gap-2">
                    <span className={`text-4xl font-bold transition-all ${highlight ? 'text-wuxia-gold' : 'text-white'} ${loadingRate ? 'opacity-40' : ''}`}>
                        {loadingRate ? '---' : toTwd(usdPrice, rate)}
                    </span>
                    <span className="text-white/50 text-sm pb-1">{period}</span>
                </div>
                {note && <p className="text-xs text-wuxia-gold/70 mt-2">{note}</p>}
                <p className="text-xs text-white/30 mt-1">約 US${usdPrice}</p>
            </div>
            <ul className="space-y-3 flex-1 mb-7">
                {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${highlight ? 'text-wuxia-gold' : 'text-white/40'}`} />
                        {f}
                    </li>
                ))}
            </ul>
            <button
                onClick={() => onCheckout(planId)}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-serif tracking-wider text-sm transition-all text-center block disabled:opacity-50 disabled:cursor-not-allowed
        ${highlight
                        ? 'bg-wuxia-gold text-black hover:bg-wuxia-gold/90 font-bold'
                        : 'border border-white/20 text-white/70 hover:border-white/50 hover:text-white'}`}
            >
                {isLoading ? '準備中...' : '選擇方案'}
            </button>
        </div>
    );
}

export function StoreSection() {
    const [rate, setRate] = useState<number | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetch('/api/exchange-rate')
            .then(r => r.json())
            .then(d => setRate(d.rate))
            .catch(() => setRate(32)); // fallback
    }, []);

    const handleCheckout = async (planId: string) => {
        setLoadingPlan(planId);
        setError(null);

        try {
            // 先從前端取得目前的 token，確保後端 API 能認得我們
            const { getSupabase } = await import('@/lib/supabase/client');
            const supabase = getSupabase();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                 alert('請先登入遊戲後再進行儲值');
                 router.push('/game');
                 return;
            }

            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}` // 明確帶上 Token
                },
                body: JSON.stringify({ planId }),
            });

            const data = await response.json();

            // 如果沒登入，跳轉到首頁或顯示錯誤 (我們在 API 已經擋 401 了)
            if (response.status === 401) {
                 alert('請先登入遊戲後再進行儲值');
                 router.push('/game');
                 return;
            }

            if (!response.ok) {
                throw new Error(data.error || '結帳發起失敗');
            }

            // 因為您的商店代號 (MS1820413366) 是正式環境的代號，
            // 且我們正在等待藍新金流審核通過，所以這裡直接固定打向正式機。
            // 正式機: https://core.newebpay.com/MPG/mpg_gateway
            const defaultActionUrl = 'https://core.newebpay.com/MPG/mpg_gateway';

            const actionUrl = process.env.NEXT_PUBLIC_NEWEBPAY_URL || defaultActionUrl;

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = actionUrl;
            form.style.display = 'none';

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
                input.value = value as string;
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();

        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message);
            setLoadingPlan(null);
        }
    };

    return (
        <section id="pricing" className="py-24 px-6 relative">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-xs text-wuxia-gold/60 tracking-[0.5em] uppercase font-mono mb-3">Black Market</p>
                    <h2 className="text-3xl font-serif text-white mb-4">黑市商人</h2>
                    <p className="text-sm text-white/40 mb-4">「少俠，想要在江湖走得長遠，盤纏是少不了的...」</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-xs text-white/30">所有方案可跨世界使用・回合不限使用哪個世界</p>
                        {rate && (
                            <span className="text-xs text-white/25 font-mono">
                                （匯率 1 USD = {rate.toFixed(1)} TWD）
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="max-w-2xl mx-auto bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-md mb-8 text-center text-sm">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                    <PlanCard
                        planId="WANDERER"
                        name="旅者方案"
                        usdPrice={8}
                        period="/ 月"
                        rate={rate}
                        features={[
                            '每日 60 次生成額度',
                            '跨所有開放世界',
                            '雲端存檔同步',
                            '可隨時取消',
                        ]}
                        onCheckout={handleCheckout}
                        isLoading={loadingPlan === 'WANDERER'}
                    />
                    <PlanCard
                        planId="STORYTELLER"
                        name="說書人方案"
                        usdPrice={18}
                        period="/ 月"
                        badge="最推薦"
                        rate={rate}
                        features={[
                            '每日 180 次生成額度',
                            '支援最新進階模型',
                            '跨所有開放世界',
                            '雲端存檔同步',
                        ]}
                        highlight={true}
                        onCheckout={handleCheckout}
                        isLoading={loadingPlan === 'STORYTELLER'}
                    />
                    <PlanCard
                        planId="ADDON"
                        name="篇章補充包"
                        usdPrice={4.99}
                        period="/ 次"
                        note="適合非定期玩家"
                        rate={rate}
                        features={[
                            '一次性 300 次生成額度',
                            '永久有效，不過期',
                            '優先於訂閱額度扣除',
                            '無需訂閱',
                        ]}
                        onCheckout={handleCheckout}
                        isLoading={loadingPlan === 'ADDON'}
                    />
                </div>

                <div className="mt-8 p-5 rounded-lg border border-white/10 bg-white/3 text-center max-w-2xl mx-auto">
                    <p className="text-sm text-white/50">
                        <Sparkles className="w-3 h-3 inline mr-2 text-wuxia-gold/60" />
                        目前正式上線前為免費體驗期，訂閱系統即將開放
                    </p>
                </div>
            </div>
        </section>
    );
}
