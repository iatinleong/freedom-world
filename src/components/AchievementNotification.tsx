'use client';

import { useEffect, useState } from 'react';
import { Trophy, X } from 'lucide-react';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon?: string;
}

interface AchievementNotificationProps {
    achievement: Achievement | null;
    onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (achievement) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 500);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    return (
        <div
            className={`fixed bottom-8 right-8 z-[150] transition-all duration-500 ${
                isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[500px] opacity-0'
            }`}
        >
            <div className="w-[380px] bg-gradient-to-br from-wuxia-ink-blue/95 to-black/95 backdrop-blur-xl border-2 border-wuxia-gold/50 rounded-lg shadow-2xl shadow-wuxia-gold/30 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-2 bg-wuxia-gold/20 border-b border-wuxia-gold/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-wuxia-gold animate-pulse" />
                        <span className="text-xs font-bold text-wuxia-gold uppercase tracking-wider">
                            成就解鎖
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            setTimeout(onClose, 500);
                        }}
                        className="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="w-3 h-3 text-white/60 hover:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-wuxia-gold/30 to-wuxia-bronze/20 rounded-lg flex items-center justify-center border border-wuxia-gold/40 shadow-lg">
                        {achievement.icon ? (
                            <span className="text-3xl">{achievement.icon}</span>
                        ) : (
                            <Trophy className="w-8 h-8 text-wuxia-gold" />
                        )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-wuxia-gold mb-1 font-serif tracking-wide">
                            {achievement.title}
                        </h3>
                        <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
                            {achievement.description}
                        </p>
                    </div>
                </div>

                {/* Progress bar animation */}
                <div className="h-1 bg-black/50 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-wuxia-gold via-wuxia-bronze to-wuxia-gold animate-shimmer"
                        style={{ width: isVisible ? '100%' : '0%', transition: 'width 5s linear' }}
                    />
                </div>
            </div>
        </div>
    );
}

// Example usage component
export function AchievementSystem() {
    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);

    // Example function to trigger achievement
    const triggerAchievement = (achievement: Achievement) => {
        setCurrentAchievement(achievement);
    };

    // Example achievements
    useEffect(() => {
        // This is just for demonstration - remove or connect to actual game logic
        const timer = setTimeout(() => {
            // Uncomment to test
            // triggerAchievement({
            //     id: '1',
            //     title: '初入江湖',
            //     description: '完成你的第一次冒險選擇',
            //     icon: '⚔️',
            // });
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AchievementNotification
            achievement={currentAchievement}
            onClose={() => setCurrentAchievement(null)}
        />
    );
}
