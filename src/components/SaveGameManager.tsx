'use client';

import { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, Download, Upload, X, Clock, MapPin, TrendingUp, Loader2 } from 'lucide-react';
import { useGameStore } from '@/lib/engine/store';
import { useSaveGameStore, SaveSlot } from '@/lib/engine/saveGameStore';
import { cn } from '@/lib/utils';

interface SaveGameManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SaveGameManager({ isOpen, onClose }: SaveGameManagerProps) {
    const [activeTab, setActiveTab] = useState<'save' | 'load'>('save');
    const [saveName, setSaveName] = useState('');
    const [playTime, setPlayTime] = useState(0);
    const [selectedSave, setSelectedSave] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingGame, setIsLoadingGame] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const player = useGameStore((state) => state.player);
    const world = useGameStore((state) => state.world);
    const system = useGameStore((state) => state.system);
    const narrative = useGameStore((state) => state.narrative);
    const options = useGameStore((state) => state.options);
    const summary = useGameStore((state) => state.summary);
    const isGameStarted = useGameStore((state) => state.isGameStarted);
    const isCharacterPanelOpen = useGameStore((state) => state.isCharacterPanelOpen);
    const notifications = useGameStore((state) => state.notifications);
    const loadGameState = useGameStore((state) => state.loadGameState);
    const sessionId = useGameStore((state) => state.sessionId);

    const gameState = useMemo(() => ({
        player, world, system, narrative, options, summary,
        isGameStarted, isCharacterPanelOpen, notifications,
        isProcessing: false,
        usage: { totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0 },
    }), [player, world, system, narrative, options, summary, isGameStarted, isCharacterPanelOpen, notifications]);

    const { saves, isLoading, fetchSaves, saveGame, loadGame, deleteSave } = useSaveGameStore();

    // Fetch saves from Supabase when modal opens
    useEffect(() => {
        if (isOpen) fetchSaves();
    }, [isOpen, fetchSaves]);

    // Play time timer
    useEffect(() => {
        if (!isOpen) return;
        const timer = setInterval(() => setPlayTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}小時 ${minutes}分鐘`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const handleSave = async () => {
        if (!saveName.trim()) { alert('請輸入存檔名稱'); return; }
        setIsSaving(true);
        await saveGame(saveName, gameState, playTime, sessionId);
        setSaveName('');
        setIsSaving(false);
        alert('存檔成功！');
        setActiveTab('load');
    };

    const handleLoad = async () => {
        if (!selectedSave) { alert('請選擇要載入的存檔'); return; }
        setIsLoadingGame(true);
        const save = await loadGame(selectedSave);
        if (save) {
            loadGameState(save.gameState, save.sessionId);
            setPlayTime(save.playTime);
            alert('載入成功！');
            onClose();
        }
        setIsLoadingGame(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('確定要刪除此存檔嗎？')) return;
        setIsDeleting(id);
        await deleteSave(id);
        if (selectedSave === id) setSelectedSave(null);
        setIsDeleting(null);
    };

    const handleExportSave = (save: SaveSlot, e: React.MouseEvent) => {
        e.stopPropagation();
        const dataStr = JSON.stringify(save, null, 2);
        const url = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${save.name}-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-3xl animate-slide-up">
                <div className="bg-gradient-to-b from-wuxia-ink-blue/95 to-black/95 backdrop-blur-xl border-2 border-wuxia-gold/40 rounded-lg shadow-2xl shadow-wuxia-gold/20 overflow-hidden max-h-[80vh] flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-wuxia-gold/20 bg-black/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <Save className="w-5 h-5 text-wuxia-gold" />
                            <h2 className="text-lg font-serif text-wuxia-gold tracking-widest">存檔管理</h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-sm border border-wuxia-gold/30 flex items-center justify-center hover:bg-wuxia-crimson/20 hover:border-wuxia-crimson transition-all group">
                            <X className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-crimson" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 px-6 pt-4 shrink-0">
                        {(['save', 'load'] as const).map(t => (
                            <button key={t} onClick={() => setActiveTab(t)}
                                className={cn('px-4 py-2 rounded-sm font-serif text-sm transition-all border',
                                    activeTab === t
                                        ? 'bg-wuxia-gold/20 border-wuxia-gold/50 text-wuxia-gold'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:border-wuxia-gold/30 hover:text-white/70'
                                )}>
                                {t === 'save' ? <><Save className="w-3 h-3 inline mr-2" />保存遊戲</> : <><Download className="w-3 h-3 inline mr-2" />載入遊戲 ({saves.length})</>}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        {activeTab === 'save' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-wuxia-gold/5 border border-wuxia-gold/20 rounded-lg space-y-3">
                                    <h3 className="text-sm font-serif text-wuxia-gold tracking-wide">當前遊戲狀態</h3>
                                    <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-wuxia-gold" /><span>位置: {gameState.world.location}</span></div>
                                        <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-wuxia-gold" /><span>等級: {gameState.player.stats.level}</span></div>
                                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-wuxia-gold" /><span>遊戲時間: {formatTime(playTime)}</span></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm text-white/70 font-serif">存檔名稱</label>
                                    <input type="text" value={saveName} onChange={e => setSaveName(e.target.value)}
                                        placeholder="請輸入存檔名稱..." maxLength={30}
                                        className="w-full px-4 py-3 bg-black/50 border border-wuxia-gold/30 rounded-sm text-white font-serif focus:border-wuxia-gold focus:outline-none transition-colors" />
                                    <button onClick={handleSave} disabled={isSaving}
                                        className="w-full py-3 bg-gradient-to-r from-wuxia-gold/80 to-wuxia-bronze/80 hover:from-wuxia-gold hover:to-wuxia-bronze border border-wuxia-gold/50 rounded-sm text-black font-bold font-serif tracking-wider transition-all shadow-lg hover:shadow-wuxia-gold/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />儲存中...</> : '保存遊戲'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="text-center py-12 text-white/40">
                                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-wuxia-gold/50" />
                                        <p className="font-serif text-sm">載入存檔中...</p>
                                    </div>
                                ) : saves.length === 0 ? (
                                    <div className="text-center py-12 text-white/40">
                                        <Save className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="font-serif">暫無存檔</p>
                                    </div>
                                ) : (
                                    <>
                                        {saves.map(save => (
                                            <div key={save.id} onClick={() => setSelectedSave(save.id)}
                                                className={cn('p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg',
                                                    selectedSave === save.id
                                                        ? 'bg-wuxia-gold/10 border-wuxia-gold/50 shadow-wuxia-gold/20'
                                                        : 'bg-white/5 border-white/10 hover:border-wuxia-gold/30'
                                                )}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-serif text-wuxia-gold font-bold">{save.name}</h4>
                                                            {save.isAutoSave && (
                                                                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded text-cyan-400">AUTO</span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                                                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{save.location}</div>
                                                            <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />等級 {save.level}</div>
                                                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(save.playTime)}</div>
                                                            <div className="text-white/40 text-[10px]">{formatDate(save.timestamp)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={e => handleExportSave(save, e)} title="匯出存檔"
                                                            className="p-2 hover:bg-wuxia-gold/20 rounded-sm transition-colors border border-transparent hover:border-wuxia-gold/40">
                                                            <Upload className="w-4 h-4 text-wuxia-gold/70" />
                                                        </button>
                                                        <button onClick={e => handleDelete(save.id, e)} title="刪除存檔" disabled={isDeleting === save.id}
                                                            className="p-2 hover:bg-wuxia-crimson/20 rounded-sm transition-colors border border-transparent hover:border-wuxia-crimson/40 disabled:opacity-50">
                                                            {isDeleting === save.id
                                                                ? <Loader2 className="w-4 h-4 animate-spin text-wuxia-crimson/70" />
                                                                : <Trash2 className="w-4 h-4 text-wuxia-crimson/70" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={handleLoad} disabled={!selectedSave || isLoadingGame}
                                            className="w-full py-3 bg-gradient-to-r from-wuxia-gold/80 to-wuxia-bronze/80 hover:from-wuxia-gold hover:to-wuxia-bronze border border-wuxia-gold/50 rounded-sm text-black font-bold font-serif tracking-wider transition-all shadow-lg hover:shadow-wuxia-gold/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                            {isLoadingGame ? <><Loader2 className="w-4 h-4 animate-spin" />載入中...</> : '載入選中的存檔'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
