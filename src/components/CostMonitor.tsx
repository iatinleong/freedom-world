'use client';

import { useEffect, useState } from 'react';
import { useUsageStore } from '@/lib/engine/usageStore';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export function CostMonitor() {
    const { totalCost, totalInputTokens, totalOutputTokens, sessionCount, resetUsage } = useUsageStore();
    const [hydrated, setHydrated] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // Handle hydration mismatch for SSR
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHydrated(true);
    }, []);

    // Don't render until hydrated to avoid SSR mismatch
    if (!hydrated) {
        return (
            <div className="fixed left-4 top-1/2 -translate-y-1/2 p-4 bg-black/80 backdrop-blur border border-white/10 rounded-lg text-sm font-mono text-white/50 space-y-2 hidden xl:block">
                <div className="text-wuxia-gold font-bold mb-2 border-b border-white/10 pb-1">API 用量</div>
                <div className="text-white/30">載入中...</div>
            </div>
        );
    }

    const totalTokens = totalInputTokens + totalOutputTokens;
    const avgCostPerSession = sessionCount > 0 ? totalCost / sessionCount : 0;

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2 w-64 bg-gradient-to-br from-black/90 to-wuxia-ink-blue/80 backdrop-blur-xl border-2 border-wuxia-gold/30 rounded-lg shadow-2xl shadow-wuxia-gold/10 overflow-hidden hidden xl:block group transition-all duration-300">
            {/* Header */}
            <div
                className="px-4 py-3 bg-wuxia-gold/10 border-b border-wuxia-gold/20 flex items-center justify-between cursor-pointer hover:bg-wuxia-gold/15 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-wuxia-gold animate-pulse shadow-lg shadow-wuxia-gold"></div>
                    <span className="text-xs font-bold text-wuxia-gold font-serif tracking-wider">API 使用統計</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            resetUsage();
                        }}
                        className="p-1.5 hover:bg-wuxia-gold/20 rounded-sm transition-all border border-transparent hover:border-wuxia-gold/40 group/btn"
                        title="重置統計"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-wuxia-gold/70 group-hover/btn:text-wuxia-gold group-hover/btn:rotate-180 transition-all duration-300" />
                    </button>
                    <div className="p-1.5">
                        {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-wuxia-gold/70" />
                        ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-wuxia-gold/70" />
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <>
                    <div className="p-4 space-y-3 text-xs font-mono animate-slide-up">
                        {/* Cost */}
                        <div className="p-3 bg-wuxia-gold/5 rounded-sm border border-wuxia-gold/20 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">總費用</span>
                                <span className="text-lg font-bold text-wuxia-gold">${totalCost.toFixed(5)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-white/40">平均/次</span>
                                <span className="text-wuxia-gold/70">${avgCostPerSession.toFixed(5)}</span>
                            </div>
                        </div>

                        {/* Tokens */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                                <span className="text-white/60">輸入 Token</span>
                                <span className="text-cyan-400 font-semibold">{totalInputTokens.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                                <span className="text-white/60">輸出 Token</span>
                                <span className="text-emerald-400 font-semibold">{totalOutputTokens.toLocaleString()}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                    <span>Token 使用</span>
                                    <span>{totalTokens.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyan-500 via-wuxia-gold to-emerald-500 transition-all duration-500"
                                        style={{
                                            width: `${Math.min((totalTokens / 100000) * 100, 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sessions */}
                        <div className="pt-2 border-t border-wuxia-gold/20 flex items-center justify-between">
                            <span className="text-white/50">遊戲回合</span>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-sm bg-wuxia-gold/20 border border-wuxia-gold/40 flex items-center justify-center">
                                    <span className="text-wuxia-gold font-bold">{sessionCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 bg-black/50 border-t border-wuxia-gold/10 text-[10px] text-white/30 text-center">
                        <span>Gemini 2.0 Flash Lite</span>
                    </div>
                </>
            )}
        </div>
    );
}
