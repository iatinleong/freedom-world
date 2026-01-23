'use client';

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Trophy, Package, Swords, Crown, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'achievement' | 'item' | 'skill' | 'title' | 'system';

interface NotificationData {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    icon?: string;
}

export interface NotificationRef {
    notify: (data: Omit<NotificationData, 'id'>) => void;
}

export const GameNotification = forwardRef<NotificationRef>((props, ref) => {
    const [queue, setQueue] = useState<NotificationData[]>([]);
    const [current, setCurrent] = useState<NotificationData | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useImperativeHandle(ref, () => ({
        notify: (data) => {
            const id = Math.random().toString(36).substring(7);
            setQueue(prev => [...prev, { ...data, id }]);
        }
    }));

    useEffect(() => {
        if (!current && queue.length > 0) {
            const next = queue[0];
            setCurrent(next);
            setQueue(prev => prev.slice(1));
            setIsVisible(true);

            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setCurrent(null), 500); // Wait for fade out
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [queue, current]);

    if (!current) return null;

    const getIcon = () => {
        if (current.icon) return <span className="text-3xl">{current.icon}</span>;
        switch (current.type) {
            case 'achievement': return <Trophy className="w-8 h-8 text-wuxia-gold" />;
            case 'item': return <Package className="w-8 h-8 text-amber-500" />;
            case 'skill': return <Swords className="w-8 h-8 text-cyan-400" />;
            case 'title': return <Crown className="w-8 h-8 text-wuxia-gold" />;
            default: return <Sparkles className="w-8 h-8 text-white" />;
        }
    };

    const getTypeLabel = () => {
        switch (current.type) {
            case 'achievement': return '成就解鎖';
            case 'item': return '獲得物品';
            case 'skill': return '領悟武學';
            case 'title': return '獲得稱號';
            default: return '系統訊息';
        }
    };

    return (
        <div
            className={cn(
                "fixed top-24 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 transform",
                isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95 pointer-events-none"
            )}
        >
            <div className="w-[320px] bg-black/90 backdrop-blur-xl border border-wuxia-gold/40 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Decorative gold line */}
                <div className="h-0.5 bg-gradient-to-r from-transparent via-wuxia-gold/60 to-transparent" />
                
                <div className="p-4 flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-wuxia-gold/5 border border-wuxia-gold/20 rounded-full">
                        {getIcon()}
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] text-wuxia-gold/60 font-serif tracking-widest mb-0.5 uppercase">
                            {getTypeLabel()}
                        </div>
                        <h3 className="text-sm font-bold text-wuxia-gold font-serif tracking-wide">
                            {current.title}
                        </h3>
                        <p className="text-[11px] text-white/60 leading-tight mt-1 line-clamp-1">
                            {current.description}
                        </p>
                    </div>
                </div>

                {/* Closing Timer Bar */}
                <div className="h-[1px] bg-white/5 overflow-hidden">
                    <div
                        className="h-full bg-wuxia-gold/40"
                        style={{ 
                            width: isVisible ? '0%' : '100%', 
                            transition: isVisible ? 'width 4s linear' : 'none' 
                        }}
                    />
                </div>
            </div>
        </div>
    );
});

GameNotification.displayName = 'GameNotification';
