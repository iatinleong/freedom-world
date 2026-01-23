'use client';

import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export function KeyboardShortcuts() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Show shortcuts with '?' key
            if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                setIsVisible((prev) => !prev);
            }

            // Close with Escape
            if (e.key === 'Escape' && isVisible) {
                setIsVisible(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isVisible]);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 left-4 w-10 h-10 rounded-sm bg-black/80 border border-wuxia-gold/30 backdrop-blur-md flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group shadow-lg z-[100]"
                title="鍵盤快捷鍵 (?)"
            >
                <Keyboard className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold transition-colors" />
            </button>
        );
    }

    const shortcuts = [
        { keys: ['1', '2', '3', '4'], description: '選擇對應選項' },
        { keys: ['C'], description: '打開角色面板' },
        { keys: ['I'], description: '打開背包' },
        { keys: ['E'], description: '展開/收起狀態欄' },
        { keys: ['?'], description: '顯示/隱藏快捷鍵' },
        { keys: ['Esc'], description: '關閉對話框' },
        { keys: ['F11'], description: '全屏模式' },
        { keys: ['S'], description: '打開設置' },
    ];

    return (
        <>
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] animate-fade-in"
                onClick={() => setIsVisible(false)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[120] animate-slide-up">
                <div className="bg-gradient-to-b from-wuxia-ink-blue/95 to-black/95 backdrop-blur-xl border-2 border-wuxia-gold/40 rounded-lg shadow-2xl shadow-wuxia-gold/20 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-wuxia-gold/20 bg-black/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Keyboard className="w-5 h-5 text-wuxia-gold" />
                            <h2 className="text-lg font-serif text-wuxia-gold tracking-widest">鍵盤快捷鍵</h2>
                        </div>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="w-8 h-8 rounded-sm border border-wuxia-gold/30 flex items-center justify-center hover:bg-wuxia-crimson/20 hover:border-wuxia-crimson transition-all group"
                        >
                            <X className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-crimson" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-sm bg-white/5 border border-white/10 hover:border-wuxia-gold/30 hover:bg-wuxia-gold/5 transition-all"
                            >
                                <span className="text-sm text-white/70">{shortcut.description}</span>
                                <div className="flex gap-1">
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <kbd
                                            key={keyIndex}
                                            className="kbd min-w-[2rem] text-center"
                                        >
                                            {key}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-wuxia-gold/20 bg-black/50 text-center">
                        <p className="text-xs text-white/40 font-serif">
                            按 <kbd className="kbd">?</kbd> 或 <kbd className="kbd">Esc</kbd> 關閉此面板
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
