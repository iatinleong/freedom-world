'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { useSaveGameStore } from '@/lib/engine/saveGameStore';
import { SaveGameManager } from './SaveGameManager';
import { Skull, RotateCcw, Save } from 'lucide-react';

export function DeathScreen() {
    const { resetGame } = useGameStore();
    const { clearNarrative } = useSaveGameStore();
    const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);

    const handleRestart = async () => {
        if (confirm('確定要重新開始嗎？當前進度將會丟失。')) {
            const sessionId = useGameStore.getState().sessionId;
            await clearNarrative(sessionId);
            resetGame();
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-fade-in">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1920&auto=format&fit=crop')] opacity-20 bg-cover bg-center grayscale mix-blend-overlay pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center gap-8 p-12 border-y-2 border-red-900/50 bg-black/80 backdrop-blur-sm w-full max-w-2xl text-center">
                    <Skull className="w-24 h-24 text-red-700 animate-pulse" />

                    <div className="space-y-4">
                        <h1 className="text-6xl font-serif text-red-600 tracking-[0.5em] font-bold drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                            勝敗乃兵家常事
                        </h1>
                        <p className="text-xl text-red-400/60 font-serif italic">
                            「十八年後，又是一條好漢...」
                        </p>
                    </div>

                    <div className="flex gap-6 mt-8">
                        <button
                            onClick={handleRestart}
                            className="flex items-center gap-2 px-8 py-4 bg-red-900/20 border border-red-700/50 rounded hover:bg-red-900/40 hover:border-red-500 transition-all group"
                        >
                            <RotateCcw className="w-5 h-5 text-red-500 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-red-100 font-serif tracking-widest text-lg">重新來過</span>
                        </button>
                        <button
                            onClick={() => setIsSaveManagerOpen(true)}
                            className="flex items-center gap-2 px-8 py-4 bg-wuxia-gold/10 border border-wuxia-gold/40 rounded hover:bg-wuxia-gold/20 hover:border-wuxia-gold/70 transition-all group"
                        >
                            <Save className="w-5 h-5 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
                            <span className="text-wuxia-gold/90 font-serif tracking-widest text-lg">載入存檔</span>
                        </button>
                    </div>

                    <div className="text-xs text-white/20 font-mono mt-8">
                        Tip: 江湖險惡，下次記得多備金創藥。
                    </div>
                </div>
            </div>
            <SaveGameManager
                isOpen={isSaveManagerOpen}
                onClose={() => setIsSaveManagerOpen(false)}
            />
        </>
    );
}
