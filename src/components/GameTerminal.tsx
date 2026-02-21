'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { cn } from '@/lib/utils';
import { X, Scroll, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

import { Typewriter } from './Typewriter';

export function GameTerminal() {
    const narrative = useGameStore((state) => state.narrative);
    const worldState = useGameStore((state) => state.worldState);
    const isQuestPanelOpen = useGameStore((state) => state.isQuestPanelOpen);
    const setQuestPanelOpen = useGameStore((state) => state.setQuestPanelOpen);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [expandedStage, setExpandedStage] = useState<number | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrative]);

    const assistantCount = narrative.filter(l => l.role === 'assistant').length;
    const questStartTurn = worldState?.questStartTurn ?? 0;
    const QUEST_TURNS = 6;
    const turnsIntoQuest = Math.max(0, assistantCount - questStartTurn);
    const questProgress = Math.min(100, Math.round((turnsIntoQuest / QUEST_TURNS) * 100));

    const questHistory = worldState?.questHistory ?? [];
    const questStageSummaries = worldState?.questStageSummaries ?? [];
    const questArc = worldState?.questArc ?? [];
    const questArcIndex = worldState?.questArcIndex ?? 0;
    // Chapters yet to be reached (after current index)
    const upcomingChapters = questArc.slice(questArcIndex + 1);

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-serif text-lg leading-loose text-foreground/90 paper-edge bg-gradient-to-b from-black/40 to-black/60 bamboo-texture relative scroll-smooth">

            {/* Quest + Chronicle Panel */}
            {isQuestPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setQuestPanelOpen(false)}>
                    <div
                        className="relative w-full max-w-lg max-h-[85vh] bg-[#1a1a1a] border-2 border-wuxia-gold/30 rounded overflow-hidden shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-wuxia-gold/20 bg-black/40">
                            <div className="flex items-center gap-2">
                                <Scroll className="w-5 h-5 text-wuxia-gold" />
                                <h2 className="text-xl font-serif text-wuxia-gold tracking-widest">江湖記事</h2>
                            </div>
                            <button onClick={() => setQuestPanelOpen(false)} className="text-white/50 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">

                            {/* Progress Bar — always on top */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40 font-mono">階段進度</span>
                                    <span className="text-wuxia-gold/60 font-mono tabular-nums">
                                        {turnsIntoQuest} / {QUEST_TURNS} 回合（{questProgress}%）
                                    </span>
                                </div>
                                <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-wuxia-gold/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-wuxia-gold/40 via-wuxia-gold to-amber-300 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                                        style={{ width: `${questProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-white/20 font-mono">
                                    <span>開始</span>
                                    <span>下一階段</span>
                                </div>
                            </div>

                            {/* Current Stage */}
                            {worldState?.mainQuest ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        <span className="text-xs text-wuxia-gold/80 font-serif tracking-widest">當前目標</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-wuxia-gold/20 to-transparent"></div>
                                    </div>
                                    <div className="px-4 py-3 rounded-sm bg-wuxia-gold/5 border border-wuxia-gold/20">
                                        <p className="text-base font-serif text-wuxia-gold leading-relaxed">{worldState.mainQuest}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-white/30 italic py-4">
                                    <div className="text-3xl mb-2 opacity-20">📜</div>
                                    尚未確立主線目標...
                                </div>
                            )}

                            {/* Upcoming Chapters */}
                            {upcomingChapters.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-1 h-3 bg-wuxia-gold/20 rounded-sm"></span>
                                        <span className="text-xs text-white/30 font-serif tracking-widest">後續章節</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                                        <span className="text-[10px] text-white/20 font-mono">{upcomingChapters.length} 章</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {upcomingChapters.map((chapter, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 px-3 py-2 rounded-sm border border-white/5 bg-white/[0.02]"
                                                style={{ opacity: Math.max(0.2, 0.7 - i * 0.12) }}
                                            >
                                                <span className="text-[10px] text-white/20 font-mono tabular-nums shrink-0">
                                                    第{questArcIndex + i + 2}章
                                                </span>
                                                <span className="text-sm text-white/30 font-serif leading-relaxed flex-1">
                                                    {chapter}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {questArc.length === 0 && (
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm border border-white/5 bg-white/[0.02]">
                                    <span className="text-white/20 text-sm animate-pulse">…</span>
                                    <span className="text-xs text-white/20 font-serif italic">命運的章節正在編織中</span>
                                </div>
                            )}

                            {/* Completed Stages */}
                            {questHistory.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-1 h-3 bg-white/20 rounded-sm"></span>
                                        <span className="text-xs text-white/40 font-serif tracking-widest">往事記錄</span>
                                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                                    </div>
                                    {questHistory.map((q, i) => (
                                        <div key={i} className="rounded-sm border border-white/5 overflow-hidden">
                                            <button
                                                className="w-full flex items-start gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/8 transition-colors text-left"
                                                onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500/60 mt-0.5 shrink-0" />
                                                <span className="text-sm text-white/40 font-serif leading-relaxed flex-1 line-through decoration-white/20">{q}</span>
                                                {questStageSummaries[i] && (
                                                    expandedStage === i
                                                        ? <ChevronUp className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                                                        : <ChevronDown className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                                                )}
                                            </button>
                                            {expandedStage === i && questStageSummaries[i] && (
                                                <div className="px-4 pb-3 pt-2 bg-black/30 border-t border-white/5">
                                                    <p className="text-xs text-white/50 font-serif leading-relaxed italic">
                                                        {questStageSummaries[i]}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-wuxia-gold/10 bg-black/40 text-center text-xs text-white/30 font-mono">
                            每 {QUEST_TURNS} 回合，主線推進並記錄階段事蹟
                        </div>
                    </div>
                </div>
            )}

            {/* Ink Mountain Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 fixed z-0 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-gray-900 to-transparent transform scale-y-150 origin-bottom"></div>
                <div className="absolute bottom-0 left-[-20%] w-[140%] h-48 rounded-[100%] bg-black/40 blur-xl"></div>
                <div className="absolute bottom-10 right-[-10%] w-[80%] h-64 rounded-[100%] bg-black/30 blur-2xl"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 space-y-8 pb-20">
                <div className="flex items-center justify-center opacity-30 my-8">
                    <div className="h-px w-12 bg-wuxia-gold/40"></div>
                    <div className="mx-4 text-[10px] text-wuxia-gold tracking-[0.5em]">江湖纪事</div>
                    <div className="h-px w-12 bg-wuxia-gold/40"></div>
                </div>

                {narrative.map((log, index) => (
                    <div
                        key={log.id}
                        className={cn(
                            "transition-all duration-700",
                            log.role === 'user'
                                ? "flex justify-end"
                                : "animate-dry-ink"
                        )}
                    >
                        {log.role === 'user' ? (
                            <div className="relative max-w-[80%] bg-gradient-to-br from-wuxia-ink-blue/40 to-black/60 border border-wuxia-gold/20 px-5 py-3 rounded-tr-none rounded-bl-xl rounded-tl-xl rounded-br-sm shadow-lg backdrop-blur-sm group">
                                <span className="text-wuxia-gold/90 font-serif tracking-wide italic">{log.content}</span>
                                <div className="absolute -right-1.5 -top-1.5 w-3 h-3 border-t border-r border-wuxia-gold/40 rounded-tr-sm"></div>
                                <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 border-b border-l border-wuxia-gold/40 rounded-bl-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        ) : (
                            <div className="relative pl-6 border-l-2 border-wuxia-gold/10 hover:border-wuxia-gold/30 transition-colors duration-500">
                                <div className="prose prose-invert max-w-none prose-p:my-4 prose-p:leading-[2] prose-p:text-lg text-foreground/80 font-serif">
                                    {index === narrative.length - 1 && log.role === 'assistant' ? (
                                        <Typewriter text={log.content} speed={25} />
                                    ) : (
                                        <div>{log.content}</div>
                                    )}
                                </div>
                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-black border border-wuxia-gold/40"></div>
                            </div>
                        )}

                        {index < narrative.length - 1 && log.role !== 'user' && narrative.length > 3 && (
                            <div className="mt-8 flex items-center justify-center opacity-10">
                                <div className="text-[12px] text-wuxia-gold transform rotate-45">❖</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div ref={bottomRef} />
        </div>
    );
}
