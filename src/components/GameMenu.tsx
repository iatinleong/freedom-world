'use client';

import { useState } from 'react';
import { Settings, HelpCircle, X, Volume2, VolumeX, Maximize2, Minimize2, Save, RotateCcw, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveGameManager } from './SaveGameManager';
import { useAuthStore } from '@/lib/supabase/authStore';
import { useGameStore } from '@/lib/engine/store';
import { useSaveGameStore } from '@/lib/engine/saveGameStore';
import { useAIConfigStore, PROVIDER_INFO, PROVIDER_MODELS } from '@/lib/engine/aiConfigStore';

export function GameMenu() {
    const [activeTab, setActiveTab] = useState<'settings' | 'help' | 'saves'>('settings');
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
    const { signOut } = useAuthStore();
    const { resetGame, isCharacterPanelOpen, isGameMenuOpen, setGameMenuOpen } = useGameStore();
    const { clearNarrative } = useSaveGameStore();
    const { provider, modelName } = useAIConfigStore();
    const providerLabel = PROVIDER_INFO[provider]?.name ?? provider;
    const modelLabel = PROVIDER_MODELS[provider]?.find(m => m.id === modelName)?.name ?? modelName;

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <>
            {/* Menu Overlay */}
            {isGameMenuOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                        onClick={() => setGameMenuOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl animate-slide-up">
                        <div className="bg-gradient-to-b from-wuxia-ink-blue/95 to-black/95 backdrop-blur-xl border-2 border-wuxia-gold/40 rounded-lg shadow-2xl shadow-wuxia-gold/20 overflow-hidden">
                            {/* Header */}
                            <div className="relative px-6 py-4 border-b border-wuxia-gold/20 bg-black/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-serif text-wuxia-gold tracking-widest flex items-center gap-3">
                                        <span className="text-2xl">⚙</span>
                                        <span>遊戲設置</span>
                                    </h2>
                                    <button
                                        onClick={() => setGameMenuOpen(false)}
                                        className="w-8 h-8 rounded-sm border border-wuxia-gold/30 flex items-center justify-center hover:bg-wuxia-crimson/20 hover:border-wuxia-crimson transition-all group"
                                    >
                                        <X className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-crimson" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setActiveTab('settings')}
                                        className={cn(
                                            "px-4 py-2 rounded-sm font-serif text-sm transition-all border",
                                            activeTab === 'settings'
                                                ? "bg-wuxia-gold/20 border-wuxia-gold/50 text-wuxia-gold"
                                                : "bg-white/5 border-white/10 text-white/50 hover:border-wuxia-gold/30 hover:text-white/70"
                                        )}
                                    >
                                        <Settings className="w-3 h-3 inline mr-2" />
                                        設置
                                    </button>
                                    <button
                                        onClick={() => {
                                            setGameMenuOpen(false);
                                            setIsSaveManagerOpen(true);
                                        }}
                                        className="px-4 py-2 rounded-sm font-serif text-sm transition-all border bg-white/5 border-white/10 text-white/50 hover:border-wuxia-gold/30 hover:text-white/70"
                                    >
                                        <Save className="w-3 h-3 inline mr-2" />
                                        存檔管理
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('help')}
                                        className={cn(
                                            "px-4 py-2 rounded-sm font-serif text-sm transition-all border",
                                            activeTab === 'help'
                                                ? "bg-wuxia-gold/20 border-wuxia-gold/50 text-wuxia-gold"
                                                : "bg-white/5 border-white/10 text-white/50 hover:border-wuxia-gold/30 hover:text-white/70"
                                        )}
                                    >
                                        <HelpCircle className="w-3 h-3 inline mr-2" />
                                        幫助
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {activeTab === 'settings' ? (
                                    <>
                                        {/* Display Settings */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-serif text-wuxia-gold/80 tracking-wide flex items-center gap-2">
                                                <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                                顯示設置
                                            </h3>
                                            <div className="space-y-2 pl-4">
                                                <button
                                                    onClick={toggleFullscreen}
                                                    className="w-full flex items-center justify-between p-3 rounded-sm bg-white/5 border border-white/10 hover:border-wuxia-gold/30 hover:bg-wuxia-gold/5 transition-all group"
                                                >
                                                    <span className="text-sm text-white/70 group-hover:text-white/90">全屏模式</span>
                                                    <div className="flex items-center gap-2">
                                                        {isFullscreen ? (
                                                            <>
                                                                <Minimize2 className="w-4 h-4 text-wuxia-gold" />
                                                                <span className="text-xs text-wuxia-gold">已啟用</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Maximize2 className="w-4 h-4 text-white/40" />
                                                                <span className="text-xs text-white/40">已禁用</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Audio Settings */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-serif text-wuxia-gold/80 tracking-wide flex items-center gap-2">
                                                <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                                音頻設置
                                            </h3>
                                            <div className="space-y-2 pl-4">
                                                <button
                                                    onClick={() => setIsMuted(!isMuted)}
                                                    className="w-full flex items-center justify-between p-3 rounded-sm bg-white/5 border border-white/10 hover:border-wuxia-gold/30 hover:bg-wuxia-gold/5 transition-all group"
                                                >
                                                    <span className="text-sm text-white/70 group-hover:text-white/90">音效</span>
                                                    <div className="flex items-center gap-2">
                                                        {isMuted ? (
                                                            <>
                                                                <VolumeX className="w-4 h-4 text-wuxia-crimson" />
                                                                <span className="text-xs text-wuxia-crimson">靜音</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Volume2 className="w-4 h-4 text-wuxia-gold" />
                                                                <span className="text-xs text-wuxia-gold">已啟用</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Game Controls */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-serif text-wuxia-gold/80 tracking-wide flex items-center gap-2">
                                                <span className="w-1 h-4 bg-wuxia-crimson/60 rounded-sm"></span>
                                                遊戲控制
                                            </h3>
                                            <div className="space-y-2 pl-4">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('確定要重新開始遊戲嗎？所有未保存的進度將會丟失！')) {
                                                            const oldSessionId = useGameStore.getState().sessionId;
                                                            await clearNarrative(oldSessionId);
                                                            resetGame();
                                                            setGameMenuOpen(false);
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 rounded-sm bg-wuxia-crimson/10 border border-wuxia-crimson/30 hover:border-wuxia-crimson/60 hover:bg-wuxia-crimson/20 transition-all group"
                                                >
                                                    <span className="text-sm text-wuxia-crimson/80 group-hover:text-wuxia-crimson">重新開始遊戲</span>
                                                    <RotateCcw className="w-4 h-4 text-wuxia-crimson/70 group-hover:text-wuxia-crimson group-hover:rotate-180 transition-all duration-500" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('確定要登出嗎？')) {
                                                            setGameMenuOpen(false);
                                                            resetGame();
                                                            await signOut();
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 rounded-sm bg-white/5 border border-white/10 hover:border-wuxia-gold/30 hover:bg-wuxia-gold/5 transition-all group"
                                                >
                                                    <span className="text-sm text-white/70 group-hover:text-white/90">登出帳號</span>
                                                    <LogOut className="w-4 h-4 text-white/40 group-hover:text-wuxia-gold" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Store Link */}
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-serif text-wuxia-gold/80 tracking-wide flex items-center gap-2">
                                                <span className="w-1 h-4 bg-wuxia-gold/60 rounded-sm"></span>
                                                黑市商人
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setGameMenuOpen(false);
                                                    router.push('/store');
                                                }}
                                                className="w-full flex items-center justify-between p-3 rounded-sm bg-white/5 border border-amber-900/30 hover:border-amber-500/50 hover:bg-amber-900/20 transition-all group"
                                            >
                                                <span className="text-sm text-amber-500/80 group-hover:text-amber-400 font-bold">前往儲值</span>
                                                <span className="text-lg">💰</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Help Content */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                                    <span className="text-lg">⚔️</span>
                                                    如何開始遊戲
                                                </h3>
                                                <p className="text-sm text-white/70 leading-relaxed pl-7">
                                                    遊戲開始時，系統會隨機生成你的角色屬性和初始場景。閱讀劇情描述後，從四個選項中選擇你的行動。每個選擇都會影響你的屬性、聲望和故事走向。
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                                    <span className="text-lg">📊</span>
                                                    屬性系統
                                                </h3>
                                                <ul className="text-sm text-white/70 leading-relaxed pl-7 space-y-1">
                                                    <li><span className="text-wuxia-gold">精 (HP)</span> - 生命值，歸零則遊戲結束</li>
                                                    <li><span className="text-cyan-400">氣 (Qi)</span> - 內力值，影響武學招式威力</li>
                                                    <li><span className="text-amber-400">飽食度</span> - 飢餓度，過低會影響戰鬥力</li>
                                                    <li><span className="text-wuxia-gold">銀兩</span> - 金錢，用於購買物品和服務</li>
                                                </ul>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                                    <span className="text-lg">🎯</span>
                                                    七大屬性
                                                </h3>
                                                <ul className="text-sm text-white/70 leading-relaxed pl-7 space-y-1">
                                                    <li><span className="text-wuxia-gold">膂力</span> - 影響物理傷害和負重</li>
                                                    <li><span className="text-wuxia-gold">身法</span> - 影響閃避和先手機會</li>
                                                    <li><span className="text-wuxia-gold">根骨</span> - 影響生命上限和抗性</li>
                                                    <li><span className="text-wuxia-gold">悟性</span> - 影響武學領悟速度</li>
                                                    <li><span className="text-wuxia-gold">定力</span> - 影響心法修煉和抵抗</li>
                                                    <li><span className="text-wuxia-gold">福緣</span> - 影響奇遇和暴擊率</li>
                                                    <li><span className="text-wuxia-gold">魅力</span> - 影響社交和NPC好感</li>
                                                </ul>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                                    <span className="text-lg">🏆</span>
                                                    聲望系統
                                                </h3>
                                                <ul className="text-sm text-white/70 leading-relaxed pl-7 space-y-1">
                                                    <li><span className="text-emerald-400">俠義</span> - 行俠仗義，濟弱扶傾</li>
                                                    <li><span className="text-red-400">惡名</span> - 作惡多端，無惡不作</li>
                                                    <li><span className="text-amber-400">威名</span> - 名揚江湖，威震四方</li>
                                                    <li><span className="text-slate-300">隱逸</span> - 遠離塵囂，超脫世外</li>
                                                </ul>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm font-serif text-wuxia-gold tracking-wide flex items-center gap-2">
                                                    <span className="text-lg">💡</span>
                                                    遊戲提示
                                                </h3>
                                                <ul className="text-sm text-white/70 leading-relaxed pl-7 space-y-1">
                                                    <li>點擊狀態欄可展開查看詳細屬性</li>
                                                    <li>每個選擇都有可能改變故事走向</li>
                                                    <li>注意關鍵詞高亮，它們可能藏有線索</li>
                                                    <li>合理分配屬性點，不同路線有不同需求</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-wuxia-gold/20 bg-black/50">
                                <div className="flex items-center justify-between text-xs text-white/40">
                                    <span className="font-serif">自由江湖 Freedom Jianghu</span>
                                    <span className="font-mono">Powered by {providerLabel}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <SaveGameManager
                isOpen={isSaveManagerOpen}
                onClose={() => setIsSaveManagerOpen(false)}
            />
        </>
    );
}
