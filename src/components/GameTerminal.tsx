'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { cn } from '@/lib/utils';
import { BookOpen, X, Scroll, User } from 'lucide-react';

import { Typewriter } from './Typewriter';

export function GameTerminal() {
    // Fix: Use separate selectors to avoid creating new object reference on each render
    const narrative = useGameStore((state) => state.narrative);
    const summary = useGameStore((state) => state.summary);
    const setCharacterPanelOpen = useGameStore((state) => state.setCharacterPanelOpen);
    const bottomRef = useRef<HTMLDivElement>(null);
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [narrative]);

    // 處理關鍵詞高亮（參考圖片中的紅色高亮效果）
    const highlightKeywords = (text: string) => {
        // 武俠相關關鍵詞模式
        const keywordPatterns = [
            /([一-龥]{2,4})(劍|刀|拳|掌|功|法|訣)/g,  // 武學招式
            /([一-龥]{1,3})(草|藥|丹|膏|散)/g,  // 藥材
            /([一-龥]{2,4})(派|幫|門|宗)/g,  // 門派
            /(內力|真氣|血量|飢餓)/g,  // 狀態
            /([一-龥]{2,4})(劍|刀|槍|棍|鞭)/g,  // 兵器
        ];

        let result = text;
        keywordPatterns.forEach(pattern => {
            result = result.replace(pattern, '<span class="keyword-highlight">$&</span>');
        });

        return result;
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-serif text-lg leading-loose text-foreground/90 paper-edge bg-gradient-to-b from-black/40 to-black/60 bamboo-texture relative scroll-smooth">

            {/* Floating Action Buttons */}
            <div className="fixed top-16 right-4 z-40 flex flex-col gap-2">
                <button
                    onClick={() => setCharacterPanelOpen(true)}
                    className="w-10 h-10 bg-black/80 border border-wuxia-gold/30 rounded-sm backdrop-blur-md flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group shadow-lg"
                    title="角色面板"
                >
                    <User className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
                </button>

                <button
                    onClick={() => setShowSummary(true)}
                    className="w-10 h-10 bg-black/80 border border-wuxia-gold/30 rounded-sm backdrop-blur-md flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group shadow-lg"
                    title="江湖傳聞"
                >
                    <BookOpen className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
                </button>
            </div>

            {/* Summary Modal */}            {showSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowSummary(false)}>
                    <div
                        className="relative w-full max-w-2xl max-h-[80vh] bg-[#1a1a1a] border-2 border-wuxia-gold/30 rounded overflow-hidden shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-wuxia-gold/20 bg-black/40">
                            <div className="flex items-center gap-2">
                                <Scroll className="w-5 h-5 text-wuxia-gold" />
                                <h2 className="text-xl font-serif text-wuxia-gold tracking-widest">江湖傳聞</h2>
                            </div>
                            <button onClick={() => setShowSummary(false)} className="text-white/50 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 paper-edge bamboo-texture">
                            <div className="prose prose-invert prose-p:text-white/80 prose-p:font-serif prose-p:leading-loose">
                                {summary ? (
                                    <div className="whitespace-pre-wrap">{summary}</div>
                                ) : (
                                    <div className="text-center text-white/30 italic py-10">
                                        <div className="text-4xl mb-4 opacity-20">🕮</div>
                                        初入江湖，尚無傳聞流傳...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 border-t border-wuxia-gold/10 bg-black/40 text-center text-xs text-white/30 font-mono">
                            每經過一段時日，江湖百曉生便會記錄下你的事蹟...
                        </div>
                    </div>
                </div>
            )}

            {/* Ink Mountain Background (CSS Art) */}
            <div className="absolute inset-0 pointer-events-none opacity-20 fixed z-0 overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-gray-900 to-transparent transform scale-y-150 origin-bottom"></div>
                <div className="absolute bottom-0 left-[-20%] w-[140%] h-48 rounded-[100%] bg-black/40 blur-xl"></div>
                <div className="absolute bottom-10 right-[-10%] w-[80%] h-64 rounded-[100%] bg-black/30 blur-2xl"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 space-y-8 pb-20">
                {/* 古籍裝飾 - 頂部印章 */}
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
                                        <div dangerouslySetInnerHTML={{ __html: highlightKeywords(log.content) }} />
                                    )}
                                </div>
                                {/* Decorator for AI message */}
                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-black border border-wuxia-gold/40"></div>
                            </div>
                        )}

                        {/* 段落分隔裝飾 - 僅在長段落後顯示 */}
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

