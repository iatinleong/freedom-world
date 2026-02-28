'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { useAuthStore } from '@/lib/supabase/authStore';
import { useSaveGameStore } from '@/lib/engine/saveGameStore';
import { useQuotaStore } from '@/lib/supabase/quotaStore';
import { AuthScreen } from '@/components/AuthScreen';
import { CharacterCreation } from '@/components/CharacterCreation';
import { GameTerminal } from '@/components/GameTerminal';
import { ActionPanel } from '@/components/ActionPanel';
import { StatusHUD } from '@/components/StatusHUD';
import { CostMonitor } from '@/components/CostMonitor';
import { CharacterPanel } from '@/components/CharacterPanel';
import { DeathScreen } from '@/components/DeathScreen';
import { GlobalNotificationSystem } from '@/components/GlobalNotificationSystem';
import { GameMenu } from '@/components/GameMenu';
import { User, Scroll, Settings } from 'lucide-react';

export default function GamePage() {
  const { isGameStarted, isCharacterPanelOpen, setCharacterPanelOpen, isQuestPanelOpen, setQuestPanelOpen, setGameMenuOpen, player, loadGameState } = useGameStore();
  const { user, isLoading: isAuthLoading, initialize } = useAuthStore();
  const { restoreLatestAutoSave } = useSaveGameStore();
  const { fetchQuota } = useQuotaStore();
  const [mounted, setMounted] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  // On login: load quota and restore latest auto-save
  useEffect(() => {
    if (user) {
      fetchQuota(user.id);
      if (!isGameStarted && !restored) {
        setRestored(true);
        restoreLatestAutoSave().then(save => {
          if (save) loadGameState(save.gameState, save.sessionId);
        });
      }
    }
    if (!user) setRestored(false);
  }, [user, isGameStarted, restored, fetchQuota, restoreLatestAutoSave, loadGameState]);

  if (!mounted || isAuthLoading) return null;

  if (!user) {
    return <AuthScreen />;
  }

  const isDead = isGameStarted && player.stats.hp <= 0;

  return (
    <>
      <main className="flex h-screen flex-col bg-background text-foreground overflow-hidden w-full border-x border-wuxia-gold/20 shadow-2xl shadow-black relative z-10 scroll-border">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent z-50"></div>
        <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-wuxia-gold/10 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-wuxia-gold/10 to-transparent pointer-events-none"></div>

        {isGameStarted && (
          <header className="relative shrink-0 flex items-center px-6 py-3 border-b border-wuxia-gold/20 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-sm paper-edge z-50">
            <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
              <h1 className="ancient-title text-2xl tracking-[0.5em] text-wuxia-gold drop-shadow-lg" style={{ marginRight: '-0.5em' }}>自由江湖</h1>
              <span className="text-[10px] text-wuxia-gold/40 font-serif tracking-[0.8em] uppercase opacity-70" style={{ marginRight: '-0.8em' }}>Freedom Jianghu</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setCharacterPanelOpen(true)} className="w-9 h-9 bg-black/60 border border-wuxia-gold/30 rounded-sm flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group" title="角色面板">
                <User className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
              </button>
              <button onClick={() => setQuestPanelOpen(true)} className="relative w-9 h-9 bg-black/60 border border-wuxia-gold/30 rounded-sm flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group" title="江湖記事">
                <Scroll className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
              </button>
              <button onClick={() => setGameMenuOpen(true)} className="w-9 h-9 bg-black/60 border border-wuxia-gold/30 rounded-sm flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group" title="遊戲設置">
                <Settings className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
              </button>
            </div>
          </header>
        )}

        <div className="cloud-divider my-0 shrink-0 z-40"></div>

        {isDead ? (
          <DeathScreen />
        ) : !isGameStarted ? (
          <CharacterCreation />
        ) : (
          <>
            <StatusHUD />
            <GameTerminal />
            <ActionPanel />
            <CharacterPanel isOpen={isCharacterPanelOpen} onClose={() => setCharacterPanelOpen(false)} />
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent z-50"></div>
      </main>

      <CostMonitor />
      <GlobalNotificationSystem />
      <GameMenu />
    </>
  );
}
