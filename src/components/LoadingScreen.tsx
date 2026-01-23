'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [tip, setTip] = useState('');

    const tips = [
        '江湖風雲變幻，每一步選擇都至關重要...',
        '修煉內功需要耐心與定力...',
        '結交江湖好友，或許能在關鍵時刻助你一臂之力...',
        '傳說中的神兵利器藏於何處？',
        '善惡之間，一念之差...',
        '天下武功，唯快不破...',
        '行俠仗義還是縱橫江湖，由你決定...',
    ];

    useEffect(() => {
        // Set random tip
        setTip(tips[Math.floor(Math.random() * tips.length)]);

        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setIsLoading(false), 500);
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-fade-in">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-wuxia-gold/20 via-transparent to-wuxia-crimson/20"></div>
                <div className="absolute inset-0 grid-background"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center gap-8 p-8 max-w-md w-full">
                {/* Title */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wuxia-gold/50"></div>
                        <span className="text-wuxia-gold/50 text-xl">◆</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wuxia-gold/50"></div>
                    </div>

                    <h1 className="ancient-title text-4xl mb-4">自由江湖</h1>
                    <p className="text-sm text-wuxia-gold/60 font-serif tracking-[0.5em] uppercase">
                        Freedom Jianghu
                    </p>

                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-wuxia-gold/50"></div>
                        <span className="text-wuxia-gold/50 text-xl">◆</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-wuxia-gold/50"></div>
                    </div>
                </div>

                {/* Loading animation */}
                <div className="relative w-32 h-32">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-2 border-wuxia-gold/20 rounded-full"></div>

                    {/* Middle ring */}
                    <div className="absolute inset-4 border-2 border-wuxia-gold/30 border-t-transparent rounded-full animate-spin"></div>

                    {/* Inner ring */}
                    <div
                        className="absolute inset-8 border-2 border-wuxia-bronze/40 border-b-transparent rounded-full animate-spin"
                        style={{ animationDirection: 'reverse', animationDuration: '2s' }}
                    ></div>

                    {/* Center character */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-serif text-wuxia-gold animate-pulse">武</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-3">
                    <div className="h-2 bg-black/80 rounded-full overflow-hidden border border-wuxia-gold/30 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-wuxia-bronze via-wuxia-gold to-wuxia-bronze transition-all duration-300 ease-out shadow-lg shadow-wuxia-gold/50"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs font-mono text-wuxia-gold/60">
                        <span>載入中</span>
                        <span>{Math.floor(Math.min(progress, 100))}%</span>
                    </div>
                </div>

                {/* Loading tip */}
                <div className="text-center px-6">
                    <p className="text-sm text-white/50 font-serif leading-relaxed italic animate-pulse">
                        {tip}
                    </p>
                </div>

                {/* Version */}
                <div className="absolute bottom-8 text-[10px] text-white/20 font-mono">
                    Version 0.1.0 - Powered by Gemini AI
                </div>
            </div>
        </div>
    );
}
