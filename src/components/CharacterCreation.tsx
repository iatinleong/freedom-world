'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { Dices, User, Swords, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ATTRIBUTE_NAMES: Record<string, string> = {
    strength: '膂力',
    agility: '身法',
    constitution: '根骨',
    intelligence: '悟性',
    spirit: '定力',
    luck: '福緣',
    charm: '魅力',
};

const ATTRIBUTE_DESC: Record<string, string> = {
    strength: '影響外功威力與負重',
    agility: '影響閃避與輕功效果',
    constitution: '影響氣血上限與防禦',
    intelligence: '影響修煉速度與悟招',
    spirit: '影響內力上限與抗性',
    luck: '影響奇遇與掉寶機率',
    charm: '影響NPC好感與交易',
};

export function CharacterCreation() {
    const { setPlayerProfile, setGameStarted } = useGameStore();
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [attributes, setAttributes] = useState({
        strength: 5,
        agility: 5,
        constitution: 5,
        intelligence: 5,
        spirit: 5,
        luck: 5,
        charm: 5,
    });
    const [totalPoints, setTotalPoints] = useState(0);

    // Roll attributes
    const rollAttributes = () => {
        const newAttrs = {
            strength: Math.floor(Math.random() * 10) + 1,
            agility: Math.floor(Math.random() * 10) + 1,
            constitution: Math.floor(Math.random() * 10) + 1,
            intelligence: Math.floor(Math.random() * 10) + 1,
            spirit: Math.floor(Math.random() * 10) + 1,
            luck: Math.floor(Math.random() * 10) + 1,
            charm: Math.floor(Math.random() * 10) + 1,
        };
        setAttributes(newAttrs);
    };

    // Calculate total points for display
    useEffect(() => {
        const sum = Object.values(attributes).reduce((a, b) => a + b, 0);
        setTotalPoints(sum);
    }, [attributes]);

    const handleStart = () => {
        if (!name.trim()) return;
        setPlayerProfile(name, gender, attributes);
        setGameStarted(true);
    };

    // Auto roll on mount
    useEffect(() => {
        rollAttributes();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-8 animate-fade-in text-foreground">
            {/* Title */}
            <div className="text-center space-y-2">
                <h1 className="ancient-title text-4xl mb-4">初入江湖</h1>
                <p className="text-wuxia-gold/60 font-serif italic">請設定你的俠客身分</p>
            </div>

            <div className="w-full max-w-md space-y-6 bg-black/40 p-8 rounded-lg border border-wuxia-gold/20 bamboo-texture shadow-2xl">
                
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-wuxia-gold/80 font-serif text-sm tracking-widest flex items-center gap-2">
                        <User size={14} /> 尊姓大名
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="請輸入俠名..."
                        className="w-full h-12 px-4 bg-black/60 border border-wuxia-gold/30 rounded text-center text-xl font-serif text-wuxia-gold placeholder:text-white/10 focus:border-wuxia-gold focus:outline-none focus:ring-1 focus:ring-wuxia-gold/50 transition-all input-ink"
                    />
                </div>

                {/* Gender Selection */}
                <div className="space-y-2">
                    <label className="text-wuxia-gold/80 font-serif text-sm tracking-widest flex items-center gap-2">
                        <Swords size={14} /> 性別
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setGender('male')}
                            className={cn(
                                "h-10 border rounded font-serif transition-all",
                                gender === 'male' 
                                    ? "bg-wuxia-gold/20 border-wuxia-gold text-wuxia-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]" 
                                    : "bg-transparent border-white/10 text-white/40 hover:border-wuxia-gold/50"
                            )}
                        >
                            少俠
                        </button>
                        <button
                            onClick={() => setGender('female')}
                            className={cn(
                                "h-10 border rounded font-serif transition-all",
                                gender === 'female' 
                                    ? "bg-wuxia-crimson/20 border-wuxia-crimson text-wuxia-crimson shadow-[0_0_10px_rgba(153,27,27,0.2)]" 
                                    : "bg-transparent border-white/10 text-white/40 hover:border-wuxia-crimson/50"
                            )}
                        >
                            女俠
                        </button>
                    </div>
                </div>

                {/* Attributes Rolling */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                        <label className="text-wuxia-gold/80 font-serif text-sm tracking-widest flex items-center gap-2">
                            <Sparkles size={14} /> 天賦資質
                        </label>
                        <span className="text-xs text-white/30 font-mono">總和: {totalPoints}</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                        {Object.entries(attributes).map(([key, value]) => (
                            <div key={key} className="flex flex-col items-center p-2 bg-black/60 border border-wuxia-gold/10 rounded group relative">
                                <span className="text-[10px] text-white/50 mb-1">{ATTRIBUTE_NAMES[key]}</span>
                                <span className={cn(
                                    "text-lg font-bold font-mono",
                                    value >= 9 ? "text-wuxia-gold" : 
                                    value >= 7 ? "text-wuxia-gold/80" : 
                                    value <= 3 ? "text-white/30" : "text-white/60"
                                )}>
                                    {value}
                                </span>
                                
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-white/20 px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {ATTRIBUTE_DESC[key]}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={rollAttributes}
                        className="w-full h-10 mt-2 btn-bamboo rounded flex items-center justify-center gap-2 group"
                    >
                        <Dices size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="tracking-widest font-serif">重骰天賦</span>
                    </button>
                </div>
            </div>

            {/* Start Button */}
            <button
                onClick={handleStart}
                disabled={!name.trim()}
                className="group relative px-12 py-3 bg-gradient-to-r from-wuxia-gold/10 to-wuxia-gold/20 border border-wuxia-gold/40 rounded-sm hover:border-wuxia-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 bg-wuxia-gold/5 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <span className="text-xl font-serif text-wuxia-gold tracking-[0.5em] group-hover:tracking-[0.8em] transition-all relative z-10">
                    踏入江湖
                </span>
            </button>
        </div>
    );
}
