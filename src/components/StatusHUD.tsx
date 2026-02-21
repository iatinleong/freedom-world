'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Heart, Sparkles, Apple, Coins, Crown, X } from 'lucide-react';

export function StatusHUD() {
    const { player, world, equipTitle } = useGameStore();
    const { stats, name, title, unlockedTitles } = player;
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTitleSelector, setShowTitleSelector] = useState(false);

    const hpPercent = (stats.hp / stats.maxHp) * 100;
    const qiPercent = (stats.qi / stats.maxQi) * 100;

    const handleTitleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTitleSelector(true);
    };

    return (
        <div className="flex flex-col border-b border-wuxia-gold/20 bg-gradient-to-b from-wuxia-ink-blue/50 to-black/70 backdrop-blur-md font-mono text-sm text-white/70 paper-edge bamboo-texture z-40 shadow-lg shadow-black/50">
            {/* Title Selection Modal */}
            {showTitleSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowTitleSelector(false)}>
                    <div
                        className="relative w-full max-w-sm bg-[#1a1a1a] border-2 border-wuxia-gold/30 rounded overflow-hidden shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-3 border-b border-wuxia-gold/20 bg-black/40">
                            <h3 className="text-lg font-serif text-wuxia-gold tracking-widest flex items-center gap-2">
                                <Crown size={18} /> 更換稱號
                            </h3>
                            <button onClick={() => setShowTitleSelector(false)} className="text-white/50 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                            {unlockedTitles.map(t => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        equipTitle(t);
                                        setShowTitleSelector(false);
                                    }}
                                    className={cn(
                                        "p-2 rounded border text-sm font-serif transition-all",
                                        t === title
                                            ? "bg-wuxia-gold/20 border-wuxia-gold text-wuxia-gold"
                                            : "bg-black/40 border-white/10 hover:border-wuxia-gold/50 hover:text-white"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Bar (Always Visible) */}
            <div
                className="flex flex-wrap gap-x-4 gap-y-2 p-3 items-center cursor-pointer hover:bg-wuxia-gold/5 transition-all duration-300 group select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Name & Title */}
                <div className="flex flex-col mr-2">
                    <span className="text-wuxia-gold font-serif font-bold tracking-widest text-base leading-none">{name}</span>
                    <button
                        onClick={handleTitleClick}
                        className="text-[10px] text-wuxia-gold/60 bg-wuxia-gold/10 px-1 rounded border border-wuxia-gold/20 hover:bg-wuxia-gold/20 hover:text-wuxia-gold transition-colors mt-1 w-fit"
                    >
                        {title}
                    </button>
                </div>

                {/* HP with Icon and Bar */}
                <div className="flex items-center gap-2 group/hp w-[120px]">
                    <Heart className="w-3.5 h-3.5 text-wuxia-crimson animate-breathe" />
                    <div className="flex flex-col gap-0.5 flex-1">
                        <div className="flex justify-between text-[10px] leading-none">
                            <span className="text-wuxia-crimson font-bold">精</span>
                            <span className="text-wuxia-crimson/80">{stats.hp}</span>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-wuxia-crimson/30 shadow-inner relative">
                             <div className="absolute inset-0 bg-wuxia-crimson/10 pattern-diagonal-lines"></div>
                            <div
                                className="h-full bg-gradient-to-r from-red-900 via-wuxia-crimson to-red-500 transition-all duration-500 animate-breathe shadow-[0_0_8px_rgba(153,27,27,0.6)]"
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Qi with Icon and Bar */}
                <div className="flex items-center gap-2 group/qi w-[120px]">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse-gold" />
                    <div className="flex flex-col gap-0.5 flex-1">
                        <div className="flex justify-between text-[10px] leading-none">
                            <span className="text-cyan-400 font-bold">氣</span>
                            <span className="text-cyan-400/80">{stats.qi}</span>
                        </div>
                        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-400/30 shadow-inner relative">
                             <div className="absolute inset-0 bg-cyan-400/10 pattern-diagonal-lines"></div>
                            <div
                                className="h-full bg-gradient-to-r from-blue-900 via-blue-500 to-cyan-400 transition-all duration-500 animate-breathe shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                                style={{ width: `${qiPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-gradient-to-b from-transparent via-wuxia-gold/20 to-transparent mx-1 hidden sm:block"></div>

                {/* Resources */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" title="飽食度">
                        <Apple className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-500/90 font-bold text-xs">{stats.hunger}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="銀兩">
                        <Coins className="w-3 h-3 text-wuxia-gold" />
                        <span className="text-wuxia-gold/90 font-bold text-xs">{stats.money}</span>
                    </div>
                </div>

                <div className="flex-1"></div>

                {/* Location & Time */}
                <div className="flex items-center gap-2 text-xs text-wuxia-gold/60 font-serif mr-2">
                     <span className="text-wuxia-gold/30">◆</span>
                    <span>{world.location}</span>
                    <span className="text-wuxia-gold/30">|</span>
                    <span className="italic">{world.time.period}</span>
                </div>

                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-wuxia-gold/5 border border-wuxia-gold/10 text-wuxia-gold/40 group-hover:text-wuxia-gold/70 group-hover:border-wuxia-gold/30 transition-all">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="p-5 border-t border-wuxia-gold/20 space-y-5 animate-scroll-unfurl text-sm bg-black/80 ink-edge relative overflow-hidden">

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none select-none">
                         <div className="text-9xl font-serif text-wuxia-gold">武</div>
                    </div>

                    {/* Section 1: Attributes */}
                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                            <span className="text-wuxia-gold/90 text-sm font-bold font-serif tracking-widest">根骨資質</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-wuxia-gold/20 to-transparent"></div>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {[
                                { label: '膂力', value: stats.attributes?.strength ?? 0 },
                                { label: '身法', value: stats.attributes?.agility ?? 0 },
                                { label: '根骨', value: stats.attributes?.constitution ?? 0 },
                                { label: '悟性', value: stats.attributes?.intelligence ?? 0 },
                                { label: '定力', value: stats.attributes?.spirit ?? 0 },
                                { label: '福緣', value: stats.attributes?.luck ?? 0 },
                                { label: '魅力', value: stats.attributes?.charm ?? 0 },
                            ].map((attr) => (
                                <div key={attr.label} className="flex flex-col items-center justify-center p-2 rounded-sm bg-white/5 border border-white/5 hover:border-wuxia-gold/30 hover:bg-wuxia-gold/5 transition-colors group/attr cursor-default">
                                    <span className="text-[10px] text-white/40 mb-1 group-hover/attr:text-wuxia-gold/60 transition-colors font-serif">{attr.label}</span>
                                    <span className="text-wuxia-gold font-bold text-lg font-serif">{attr.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Reputation & World */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                        {/* Reputation */}
                        <div className="space-y-3">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="w-1 h-4 bg-wuxia-crimson/60 rounded-sm"></span>
                                <span className="text-wuxia-crimson/90 text-sm font-bold font-serif tracking-widest">江湖聲望</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-wuxia-crimson/20 to-transparent"></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex justify-between items-center px-3 py-2 bg-emerald-950/30 border border-emerald-900/50 rounded-sm">
                                    <span className="text-emerald-500/80">俠義</span>
                                    <span className="text-emerald-400 font-bold">{stats.reputation.chivalry}</span>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 bg-red-950/30 border border-red-900/50 rounded-sm">
                                    <span className="text-red-500/80">惡名</span>
                                    <span className="text-red-400 font-bold">{stats.reputation.infamy}</span>
                                </div>
                                <div className="flex justify-between items-center px-3 py-2 bg-amber-950/30 border border-amber-900/50 rounded-sm">
                                    <span className="text-amber-500/80">威名</span>
                                    <span className="text-amber-400 font-bold">{stats.reputation.fame}</span>
                                </div>
                            </div>
                        </div>

                         {/* World Info */}
                         <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-1 h-4 bg-cyan-600/60 rounded-sm"></span>
                                <span className="text-cyan-500/90 text-sm font-bold font-serif tracking-widest">天時地利</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-cyan-900/20 to-transparent"></div>
                            </div>

                            <div className="flex flex-col gap-2 text-xs h-full justify-start">
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-sm border border-white/5">
                                    <span className="text-cyan-400 w-4 text-center">☁</span>
                                    <span className="text-white/50">當前天氣:</span>
                                    <span className="text-cyan-200 ml-auto">{world.weather}</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-sm border border-white/5">
                                    <span className="text-wuxia-gold w-4 text-center">📅</span>
                                    <span className="text-white/50">江湖歷:</span>
                                    <span className="text-wuxia-gold ml-auto">
                                        {world.time.year}年 {world.time.month}月 {world.time.day}日
                                    </span>
                                </div>
                                 <div className="flex items-center gap-2 p-2 bg-white/5 rounded-sm border border-white/5">
                                    <span className="text-wuxia-bronze w-4 text-center">🏷</span>
                                    <span className="text-white/50">環境特徵:</span>
                                    <div className="ml-auto flex gap-1">
                                        {world.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-white/60 border border-white/10">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
