'use client';

import { useState } from 'react';
import { User, Backpack, Swords, BookOpen, Users, Heart, X } from 'lucide-react';
import { useGameStore } from '@/lib/engine/store';
import { cn } from '@/lib/utils';

interface CharacterPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CharacterPanel({ isOpen, onClose }: CharacterPanelProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'skills' | 'relations'>('info');
    const { player } = useGameStore();

    const expToNextLevel = player.stats.level * 100; // 简化计算
    const expProgress = (player.stats.exp / expToNextLevel) * 100;

    const getMeridianName = (key: string) => {
        const names: Record<string, string> = {
            ren: '任脈',
            du: '督脈',
            chong: '衝脈',
            dai: '帶脈',
            yinqiao: '陰蹺脈',
            yangqiao: '陽蹺脈',
            yinwei: '陰維脈',
            yangwei: '陽維脈',
            central: '中脈',
        };
        return names[key] || key;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div 
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-md z-[120] transform transition-transform duration-300 ease-in-out bg-gradient-to-b from-wuxia-ink-blue/95 to-black/95 border-l-2 border-wuxia-gold/40 shadow-2xl shadow-black flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-wuxia-gold/20 bg-black/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <User className="w-5 h-5 text-wuxia-gold" />
                            <div>
                                <h2 className="text-xl font-serif text-wuxia-gold tracking-widest">
                                    {player.name}
                                </h2>
                                <p className="text-xs text-white/50 mt-0.5">
                                    {player.title} · {player.stats.origin}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-sm border border-wuxia-gold/30 flex items-center justify-center hover:bg-wuxia-crimson/20 hover:border-wuxia-crimson transition-all group"
                        >
                            <X className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-crimson" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 px-6 pt-4 shrink-0 overflow-x-auto">
                        {[
                            { id: 'info', icon: User, label: '角色信息' },
                            { id: 'inventory', icon: Backpack, label: '背包裝備' },
                            { id: 'skills', icon: Swords, label: '武學技能' },
                            { id: 'relations', icon: Users, label: '江湖關係' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    'px-4 py-2 rounded-sm font-serif text-sm transition-all border whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'bg-wuxia-gold/20 border-wuxia-gold/50 text-wuxia-gold'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:border-wuxia-gold/30 hover:text-white/70'
                                )}
                            >
                                <tab.icon className="w-3 h-3 inline mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {/* 角色信息 */}
                        {activeTab === 'info' && (
                            <div className="space-y-6">
                                {/* 等級和經驗 */}
                                <div className="p-4 bg-wuxia-gold/5 border border-wuxia-gold/20 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-serif text-wuxia-gold">等級</span>
                                        <span className="text-2xl font-bold text-wuxia-gold">
                                            Lv.{player.stats.level}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-white/60 mb-1">
                                            <span>經驗值</span>
                                            <span>{player.stats.exp} / {expToNextLevel}</span>
                                        </div>
                                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-wuxia-gold/30">
                                            <div
                                                className="h-full bg-gradient-to-r from-wuxia-bronze via-wuxia-gold to-wuxia-gold transition-all duration-500"
                                                style={{ width: `${Math.min(expProgress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 道德傾向 */}
                                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">道德傾向</span>
                                        <span className={cn(
                                            'px-3 py-1 rounded-sm text-sm font-bold',
                                            player.stats.moral === 'Good' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                                            player.stats.moral === 'Neutral' && 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
                                            player.stats.moral === 'Evil' && 'bg-red-500/20 text-red-400 border border-red-500/40'
                                        )}>
                                            {player.stats.moral}
                                        </span>
                                    </div>
                                </div>

                                {/* 經脈狀態 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        經脈狀態
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {Object.entries(player.meridians).map(([key, isOpen]) => (
                                            <div
                                                key={key}
                                                className={cn(
                                                    'p-3 rounded-sm border text-center text-sm transition-all',
                                                    isOpen
                                                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
                                                        : 'bg-white/5 border-white/10 text-white/40'
                                                )}
                                            >
                                                {getMeridianName(key)}
                                                {isOpen && <span className="ml-2">✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 特殊技能 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        特殊技能
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'medicine', label: '醫術', icon: '⚕️' },
                                            { key: 'poison', label: '毒術', icon: '☠️' },
                                            { key: 'stealth', label: '潛行', icon: '🥷' },
                                            { key: 'insight', label: '洞察', icon: '👁️' },
                                        ].map((skill) => (
                                            <div key={skill.key} className="p-3 bg-white/5 border border-white/10 rounded-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-white/70">
                                                        {skill.icon} {skill.label}
                                                    </span>
                                                    <span className="text-wuxia-gold font-bold">
                                                        {player.specialSkills[skill.key as keyof typeof player.specialSkills]}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 傷勢和狀態效果 */}
                                {(player.injuries.length > 0 || player.statusEffects.length > 0) && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-serif text-wuxia-crimson tracking-wide flex items-center gap-2">
                                            <Heart className="w-4 h-4" />
                                            傷勢與狀態
                                        </h3>
                                        {player.injuries.length > 0 && (
                                            <div className="space-y-2">
                                                {player.injuries.map((injury, idx) => (
                                                    <div key={idx} className="p-2 bg-red-900/20 border border-red-600/30 rounded-sm text-xs text-red-400">
                                                        ⚠️ {injury}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {player.statusEffects.length > 0 && (
                                            <div className="space-y-2">
                                                {player.statusEffects.map((effect, idx) => (
                                                    <div key={idx} className="p-2 bg-blue-900/20 border border-blue-600/30 rounded-sm text-xs text-blue-400">
                                                        ✨ {effect}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 背包裝備 */}
                        {activeTab === 'inventory' && (
                            <div className="space-y-6">
                                {/* 當前裝備 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        當前裝備
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { key: 'weapon', label: '武器', icon: '⚔️' },
                                            { key: 'armor', label: '護甲', icon: '🛡️' },
                                            { key: 'accessory', label: '配飾', icon: '💍' },
                                        ].map((slot) => (
                                            <div key={slot.key} className="p-4 bg-wuxia-gold/5 border border-wuxia-gold/20 rounded-lg text-center">
                                                <div className="text-2xl mb-2">{slot.icon}</div>
                                                <div className="text-xs text-white/50 mb-1">{slot.label}</div>
                                                <div className="text-sm text-wuxia-gold">
                                                    {player.equipment[slot.key as keyof typeof player.equipment] || '未裝備'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 背包物品 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        背包物品 ({player.inventory.length})
                                    </h3>
                                    {player.inventory.length === 0 ? (
                                        <div className="text-center py-12 text-white/40">
                                            <Backpack className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="font-serif">背包空空如也</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            {player.inventory.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-wuxia-gold/30 hover:bg-wuxia-gold/5 transition-all"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-serif text-wuxia-gold font-bold">{item.name}</h4>
                                                        <span className="text-xs px-2 py-0.5 bg-wuxia-gold/20 border border-wuxia-gold/40 rounded text-wuxia-gold">
                                                            x{item.count}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-white/60 mb-2">{item.description}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            'text-[10px] px-2 py-0.5 rounded',
                                                            item.type === 'weapon' && 'bg-red-500/20 text-red-400',
                                                            item.type === 'armor' && 'bg-blue-500/20 text-blue-400',
                                                            item.type === 'consumable' && 'bg-green-500/20 text-green-400',
                                                            item.type === 'material' && 'bg-gray-500/20 text-gray-400',
                                                            item.type === 'book' && 'bg-purple-500/20 text-purple-400'
                                                        )}>
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 已讀書籍 */}
                                {player.booksRead.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            已讀典籍 ({player.booksRead.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {player.booksRead.map((book, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-3 py-1.5 bg-purple-900/20 border border-purple-600/30 rounded-sm text-xs text-purple-300"
                                                >
                                                    📖 {book}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 武學技能 */}
                        {activeTab === 'skills' && (
                            <div className="space-y-6">
                                {/* 基礎武學 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        基礎武學
                                    </h3>
                                    {player.skills.basics.length === 0 ? (
                                        <p className="text-center py-8 text-white/40 text-sm">尚未習得任何基礎武學</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {player.skills.basics.map((skill, idx) => (
                                                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-wuxia-gold/30 transition-all">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-serif text-wuxia-gold font-bold">{skill.name}</h4>
                                                        <span className={cn(
                                                            'text-xs px-2 py-0.5 rounded border',
                                                            skill.type === 'external' && 'bg-red-500/20 border-red-500/40 text-red-400',
                                                            skill.type === 'internal' && 'bg-blue-500/20 border-blue-500/40 text-blue-400',
                                                            skill.type === 'light' && 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                                                        )}>
                                                            {skill.type === 'external' ? '外功' : skill.type === 'internal' ? '內功' : '輕功'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-white/60">
                                                        <span>境界: <span className="text-wuxia-gold">{skill.level}</span></span>
                                                        <span>威力: <span className="text-wuxia-gold">{(skill.power * 100).toFixed(0)}%</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 內功心法 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-cyan-400 tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-cyan-400/60 rounded-sm"></span>
                                        內功心法
                                    </h3>
                                    {player.skills.internal.length === 0 ? (
                                        <p className="text-center py-8 text-white/40 text-sm">尚未習得任何內功心法</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {player.skills.internal.map((skill, idx) => (
                                                <div key={idx} className="p-4 bg-cyan-900/10 border border-cyan-600/30 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-serif text-cyan-400 font-bold">{skill.name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-white/60">
                                                        <span>境界: <span className="text-cyan-400">{skill.level}</span></span>
                                                        <span>威力: <span className="text-cyan-400">{(skill.power * 100).toFixed(0)}%</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 江湖關係 */}
                        {activeTab === 'relations' && (
                            <div className="space-y-6">
                                {/* 師門信息 */}
                                <div className="p-4 bg-wuxia-gold/5 border border-wuxia-gold/20 rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">師父</span>
                                        <span className="text-wuxia-gold font-bold">{player.relations.master}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/70">門派</span>
                                        <span className="text-wuxia-gold font-bold">{player.relations.sect}</span>
                                    </div>
                                </div>

                                {/* 門派好感度 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        各派關係
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(player.relations.sectAffinity)
                                            .sort(([, a], [, b]) => b - a)
                                            .map(([sect, affinity]) => (
                                                <div key={sect} className="p-3 bg-white/5 border border-white/10 rounded-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm text-white/70">{sect}</span>
                                                        <span className={cn(
                                                            'text-sm font-bold',
                                                            affinity >= 70 && 'text-emerald-400',
                                                            affinity >= 40 && affinity < 70 && 'text-wuxia-gold',
                                                            affinity < 40 && 'text-red-400'
                                                        )}>
                                                            {affinity}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                                                        <div
                                                            className={cn(
                                                                'h-full transition-all duration-500',
                                                                affinity >= 70 && 'bg-emerald-500',
                                                                affinity >= 40 && affinity < 70 && 'bg-wuxia-gold',
                                                                affinity < 40 && 'bg-red-500'
                                                            )}
                                                            style={{ width: `${affinity}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* 同伴 */}
                                {player.companions.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            同行伙伴 ({player.companions.length})
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {player.companions.map((companion, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 bg-emerald-900/20 border border-emerald-600/30 rounded-sm text-center"
                                                >
                                                    <div className="text-2xl mb-1">👤</div>
                                                    <div className="text-sm text-emerald-300 font-serif">{companion}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
            </div>
        </>
    );
}
