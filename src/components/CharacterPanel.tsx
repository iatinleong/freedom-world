'use client';

import { useState } from 'react';
import { User, Backpack, Swords, BookOpen, X } from 'lucide-react';
import { useGameStore } from '@/lib/engine/store';
import { cn } from '@/lib/utils';

interface CharacterPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CharacterPanel({ isOpen, onClose }: CharacterPanelProps) {
    const [activeTab, setActiveTab] = useState<'inventory' | 'skills'>('inventory');
    const { player } = useGameStore();

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            
            {/* Drawer */}
            <div 
                className={cn(
                    "fixed top-0 right-0 h-full w-[90vw] sm:w-[400px] z-[150] transition-transform duration-300 ease-in-out bg-gradient-to-b from-wuxia-ink-blue/95 to-black/95 border-l-2 border-wuxia-gold/40 shadow-2xl shadow-black flex flex-col",
                    !isOpen && "pointer-events-none"
                )}
                style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
                onClick={(e) => e.stopPropagation()}
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
                            { id: 'inventory', icon: Backpack, label: '背包裝備' },
                            { id: 'skills', icon: Swords, label: '武學技能' },
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
                                {/* 外功 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                        外功
                                    </h3>
                                    {player.skills.basics.length === 0 ? (
                                        <p className="text-center py-8 text-white/40 text-sm">尚未習得任何外功</p>
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

                                {/* 輕功身法 */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-serif text-emerald-400 tracking-wide flex items-center gap-2">
                                        <span className="w-1 h-4 bg-emerald-400/60 rounded-sm"></span>
                                        輕功身法
                                    </h3>
                                    {(player.skills.light ?? []).length === 0 ? (
                                        <p className="text-center py-8 text-white/40 text-sm">尚未習得任何輕功身法</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {(player.skills.light ?? []).map((skill, idx) => (
                                                <div key={idx} className="p-4 bg-emerald-900/10 border border-emerald-600/30 rounded-lg">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-serif text-emerald-400 font-bold">{skill.name}</h4>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-white/60">
                                                        <span>境界: <span className="text-emerald-400">{skill.level}</span></span>
                                                        <span>威力: <span className="text-emerald-400">{(skill.power * 100).toFixed(0)}%</span></span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
            </div>
        </>
    );
}
