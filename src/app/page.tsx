'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { CharacterCreation } from '@/components/CharacterCreation';
import { GameTerminal } from '@/components/GameTerminal';
import { ActionPanel } from '@/components/ActionPanel';
import { StatusHUD } from '@/components/StatusHUD';
import { CostMonitor } from '@/components/CostMonitor';
import { CharacterPanel } from '@/components/CharacterPanel';
import { DeathScreen } from '@/components/DeathScreen';
import { GlobalNotificationSystem } from '@/components/GlobalNotificationSystem';

export default function Home() {
  const { isGameStarted, isCharacterPanelOpen, setCharacterPanelOpen, player } = useGameStore();
  // Hydration fix
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Check for death
  const isDead = isGameStarted && player.stats.hp <= 0;

  return (
    <main className="flex h-screen flex-col bg-background text-foreground overflow-hidden max-w-4xl mx-auto border-x border-wuxia-gold/20 shadow-2xl shadow-black relative z-10 scroll-border">
      {/* 頂部裝飾線 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent z-50"></div>

      {/* 左側裝飾 */}
      <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-wuxia-gold/10 to-transparent pointer-events-none"></div>

      {/* 右側裝飾 */}
      <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-gradient-to-b from-transparent via-wuxia-gold/10 to-transparent pointer-events-none"></div>

      {/* Game Title - Only show when game started */}
      {isGameStarted && (
        <header className="relative shrink-0 flex items-center justify-between px-8 py-4 border-b border-wuxia-gold/20 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-sm paper-edge z-50">
          {/* 標題裝飾 - 左側 */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-wuxia-gold/30 text-base">【</div>

          <div className="flex flex-col items-center mx-auto">
            <h1 className="ancient-title text-2xl tracking-[0.5em] text-wuxia-gold drop-shadow-lg">自由江湖</h1>
            <span className="text-[10px] text-wuxia-gold/40 font-serif tracking-[0.8em] uppercase opacity-70 mt-1">Freedom Jianghu</span>
          </div>

          {/* 標題裝飾 - 右側 */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-wuxia-gold/30 text-base">】</div>

          <span className="seal-stamp text-[10px] px-2 py-0.5 absolute right-4 top-4 rotate-12 opacity-80 shadow-lg">v0.1.0</span>
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
      
      <CostMonitor />
      <GlobalNotificationSystem />

      {/* 底部裝飾線 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent z-50"></div>
    </main>
  );
}


