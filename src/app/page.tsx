'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { useAuthStore } from '@/lib/supabase/authStore';
import { useSaveGameStore } from '@/lib/engine/saveGameStore';
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

export default function Home() {
  const { isGameStarted, isCharacterPanelOpen, setCharacterPanelOpen, isQuestPanelOpen, setQuestPanelOpen, setGameMenuOpen, player, loadGameState } = useGameStore();
  const { user, isLoading: isAuthLoading, initialize } = useAuthStore();
  const { restoreLatestAutoSave } = useSaveGameStore();
  const [mounted, setMounted] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  // On login, restore latest auto-save if game hasn't started yet
  useEffect(() => {
    if (user && !isGameStarted && !restored) {
      setRestored(true);
      restoreLatestAutoSave().then(save => {
        if (save) loadGameState(save.gameState, save.sessionId);
      });
    }
    if (!user) setRestored(false);
  }, [user, isGameStarted, restored, restoreLatestAutoSave, loadGameState]);

  if (!mounted || isAuthLoading) return null;

  // Auth gate — show login/register screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Check for death
  const isDead = isGameStarted && player.stats.hp <= 0;

  return (
    <>
      <main className="flex h-screen flex-col bg-background text-foreground overflow-hidden w-full border-x border-wuxia-gold/20 shadow-2xl shadow-black relative z-10 scroll-border">
        {/* 頂部裝飾線 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent z-50"></div>

        {/* 左側裝飾 */}
        <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-wuxia-gold/10 to-transparent pointer-events-none"></div>

        {/* 右側裝飾 */}
        <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-wuxia-gold/10 to-transparent pointer-events-none"></div>

        {/* Game Title - Only show when game started */}
        {isGameStarted && (
          <header className="relative shrink-0 flex items-center px-6 py-3 border-b border-wuxia-gold/20 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-sm paper-edge z-50">
            {/* 標題（置中） */}
            <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
              <h1 className="ancient-title text-2xl tracking-[0.5em] text-wuxia-gold drop-shadow-lg">自由江湖</h1>
              <span className="text-[10px] text-wuxia-gold/40 font-serif tracking-[0.8em] uppercase opacity-70">Freedom Jianghu</span>
            </div>

            {/* 右側導覽按鈕 */}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setCharacterPanelOpen(true)}
                className="w-9 h-9 bg-black/60 border border-wuxia-gold/30 rounded-sm flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group"
                title="角色面板"
              >
                <User className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
              </button>
              <button
                onClick={() => setQuestPanelOpen(true)}
                className="relative w-9 h-9 bg-black/60 border border-wuxia-gold/30 rounded-sm flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group"
                title="江湖記事"
              >
                <Scroll className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
              </button>
              <button
                onClick={() => setGameMenuOpen(true)}
                className="w-9 h-9 bg-black/60 border border-wuxia-gold/30 rounded-sm flex items-center justify-center hover:bg-wuxia-gold/10 hover:border-wuxia-gold/60 transition-all group"
                title="遊戲設置"
              >
                <Settings className="w-4 h-4 text-wuxia-gold/70 group-hover:text-wuxia-gold" />
              </button>
            </div>
          </header>
        )}

        {/* 雲紋分隔 */}
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
            <CharacterPanel
              isOpen={isCharacterPanelOpen}
              onClose={() => setCharacterPanelOpen(false)}
            />
          </>
        )}

        {/* 底部裝飾線 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent z-50"></div>
      </main>

      {/* These use fixed positioning — must live outside <main> to avoid stacking context issues */}
      <CostMonitor />
      <GlobalNotificationSystem />
      <GameMenu />
    </>
  );
}


