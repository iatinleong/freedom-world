'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { useUsageStore } from '@/lib/engine/usageStore';
import { useSaveGameStore } from '@/lib/engine/saveGameStore';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/engine/prompt';
import { generateGameResponse, generateStorySummary, generateNextQuest } from '@/lib/engine/gemini';
import { cn } from '@/lib/utils';

export function ActionPanel() {
    const { isProcessing, setProcessing, addLog, updatePlayerStats, updateWorld, updateWorldState, options, setOptions, narrative, getGameState, summary, updateSummary, addItem, learnSkill, addTitle, addNotification } = useGameStore();
    const { addUsage, incrementSession } = useUsageStore();
    const { autoSave } = useSaveGameStore();
    const [playTime, setPlayTime] = useState(0);
    const [customAction, setCustomAction] = useState('');
    const hasInitialized = useRef(false); // Ref to track initialization status
    const [error, setError] = useState<string | null>(null);

    // Play time tracker
    useEffect(() => {
        const timer = setInterval(() => {
            setPlayTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Initial Random Generation
    useEffect(() => {
        const initGame = async () => {
            if (narrative.length <= 1 && !isProcessing && !hasInitialized.current) { // Only init log exists and not initialized
                hasInitialized.current = true; // Mark as initialized immediately
                incrementSession();
                setProcessing(true);

                const currentState = getGameState();
                const { player } = currentState;

                try {
                    const systemPrompt = `
你是《自由江湖》的頂級遊戲主持人(GM)與說書人。現在為以下角色生成一個武俠開場場景。

角色設定：
・姓名：${player.name}（${player.gender === 'male' ? '男' : '女'}）
・膂力${player.stats.attributes.strength} 身法${player.stats.attributes.agility} 根骨${player.stats.attributes.constitution} 悟性${player.stats.attributes.intelligence} 定力${player.stats.attributes.spirit} 福緣${player.stats.attributes.luck} 魅力${player.stats.attributes.charm}

開場要求：
1. 隨機選擇地點、天氣、時辰。
2. 場景必須立刻有強烈的衝突或張力。
3. 劇情要高度體現角色屬性（悟性高→觀察敏銳，魅力高→被搭訕，福緣高→撿到遺落之物）。
4. 敘事準則：禁止模糊詞（似乎、可能、彷彿），直接描述發生了什麼。
5. 數值標竿：輕微傷害(-5~15)、顯著傷害(-20~40)、重創(-50以上)。

只回傳 JSON，格式如下：
{
  "narrative": "開場劇情（150-200字，必有具體事件，體現屬性影響）",
  "options": [
    { "label": "選項文字(4-12字)", "action": "詳細行動描述(30字以上)" },
    { "label": "選項文字", "action": "詳細行動描述" },
    { "label": "選項文字", "action": "詳細行動描述" },
    { "label": "選項文字", "action": "詳細行動描述" }
  ],
  "stateUpdate": {
    "location": "具體地點名稱",
    "weather": "天氣描述",
    "newTags": ["地點特徵標籤", "天氣標籤"],
    "mainQuest": "根據開場情境，為玩家設定第一個主線目標（20字以內，具體可執行）",
    "hpChange": 0,
    "qiChange": 0
  }
}
                    `.trim();

                    const { text: responseJson, usage: usageData } = await generateGameResponse(systemPrompt, "開始遊戲");

                    if (usageData) {
                        addUsage(usageData.promptTokenCount || 0, usageData.candidatesTokenCount || 0);
                    }

                    const response = JSON.parse(responseJson);

                    addLog({ role: 'assistant', content: response.narrative });

                    if (response.stateUpdate) {
                        // 初始階段不接受屬性變更，以免覆蓋創角數值
                        if (response.stateUpdate.location) {
                            updateWorld({ location: response.stateUpdate.location });
                        }
                        if (response.stateUpdate.weather) {
                            updateWorld({ weather: response.stateUpdate.weather });
                        }
                        if (response.stateUpdate.newTags) {
                            updateWorld({ tags: response.stateUpdate.newTags });
                        }
                        if (response.stateUpdate.mainQuest) {
                            updateWorldState({ mainQuest: response.stateUpdate.mainQuest });
                        }
                    }

                    if (response.options) {
                        setOptions(response.options);
                    }

                } catch (error: any) {
                    console.error("Init failed", error);
                    setError(error.message || "初始化失敗，請檢查網路或 API Key");
                    hasInitialized.current = false; // Allow retry
                } finally {
                    setProcessing(false);
                }
            }
        };

        initGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // actionText: 詳細描述（傳給AI），displayText: 短標籤（顯示在劇情中）
    const handleAction = async (actionText: string, displayText?: string) => {
        if (!actionText.trim() || isProcessing) return;

        setProcessing(true);
        addLog({ role: 'user', content: displayText || actionText });
        setOptions([]); // Clear options while processing

        try {
            const state = useGameStore.getState();
            const systemPrompt = buildSystemPrompt(state);
            const userPrompt = buildUserPrompt(actionText);

            const { text: responseJson, usage: usageData } = await generateGameResponse(systemPrompt, userPrompt);

            if (usageData) {
                addUsage(usageData.promptTokenCount || 0, usageData.candidatesTokenCount || 0);
            }

            const response = JSON.parse(responseJson);

            addLog({ role: 'assistant', content: response.narrative });

            if (response.stateUpdate) {
                // --- SMART GM: PLOT & COMBAT PACING (client-side detection) ---
                const ws = getGameState().worldState;

                const combatKeywords = ['攻','斬','打','殺','刀','劍','拳','踢','躲','擋','逃','衝','刺','砍','格','推','摔','踹'];
                const isCombatAction = combatKeywords.some(k => actionText.includes(k));
                const hadHpChange = !!(response.stateUpdate.hpChange);
                // A turn counts as combat if player used combat keywords, or was already in combat and took damage
                const isCombatTurn = isCombatAction || (ws.currentCombatTurns > 0 && hadHpChange);

                const wsUpdate: Partial<typeof ws> = {};
                if (isCombatTurn) {
                    wsUpdate.currentCombatTurns = ws.currentCombatTurns + 1;
                    wsUpdate.pacingCounter = 0; // reset pacing during combat
                } else {
                    wsUpdate.currentCombatTurns = 0; // combat ended or never started
                    wsUpdate.pacingCounter = Math.min(ws.pacingCounter + 1, 10);
                }
                if (response.stateUpdate.mainQuest) wsUpdate.mainQuest = response.stateUpdate.mainQuest;
                if (response.stateUpdate.plotProgress) {
                    wsUpdate.plotProgress = Math.min(100, ws.plotProgress + response.stateUpdate.plotProgress);
                }
                updateWorldState(wsUpdate);

                // --- DATA PROCESSING (PRESERVING ALL FIXES) ---
                if (response.stateUpdate.hpChange) {
                    const newHp = state.player.stats.hp + response.stateUpdate.hpChange;
                    // Protagonist's halo: HP never drops to 0 from a single action unless player sought death
                    const deathKeywords = ['赴死', '自盡', '殉道', '自刎', '跳崖'];
                    const soughtDeath = deathKeywords.some(k => actionText.includes(k));
                    updatePlayerStats({ hp: soughtDeath ? Math.max(0, newHp) : Math.max(1, newHp) });
                }
                if (response.stateUpdate.qiChange) {
                    updatePlayerStats({ qi: Math.max(0, state.player.stats.qi + response.stateUpdate.qiChange) });
                }
                if (response.stateUpdate.hungerChange) {
                    updatePlayerStats({ hunger: Math.max(0, state.player.stats.hunger + response.stateUpdate.hungerChange) });
                }
                if (response.stateUpdate.expChange) {
                    updatePlayerStats({ exp: state.player.stats.exp + response.stateUpdate.expChange });
                }
                if (response.stateUpdate.moneyChange) {
                    updatePlayerStats({ money: state.player.stats.money + response.stateUpdate.moneyChange });
                }
                if (response.stateUpdate.attributeChanges) {
                    const newAttributes = { ...state.player.stats.attributes };
                    Object.entries(response.stateUpdate.attributeChanges).forEach(([attr, change]) => {
                        if (attr in newAttributes) {
                            // @ts-expect-error - Dynamic key access
                            newAttributes[attr] += change;
                        }
                    });
                    updatePlayerStats({ attributes: newAttributes });
                }
                if (response.stateUpdate.reputationChanges) {
                    const newReputation = { ...state.player.stats.reputation };
                    Object.entries(response.stateUpdate.reputationChanges).forEach(([rep, change]) => {
                        if (rep in newReputation) {
                            // @ts-expect-error - Dynamic key access
                            newReputation[rep] += change;
                        }
                    });
                    updatePlayerStats({ reputation: newReputation });
                }
                if (response.stateUpdate.newTags || response.stateUpdate.removedTags) {
                    const currentTags = new Set(state.world.tags);
                    response.stateUpdate.newTags?.forEach((tag: string) => currentTags.add(tag));
                    response.stateUpdate.removedTags?.forEach((tag: string) => currentTags.delete(tag));
                    updateWorld({ tags: Array.from(currentTags) });
                }

                // Handle Items
                if (response.stateUpdate.newItems) {
                    response.stateUpdate.newItems.forEach((item: any) => {
                        addItem(item);
                        addLog({ role: 'system', content: `獲得物品：${item.name} x${item.count}` });
                        addNotification({
                            type: 'item',
                            title: item.name,
                            description: item.description || `獲得 ${item.count} 個 ${item.name}`,
                            icon: '📦'
                        });
                    });
                }

                // Handle Skills
                if (response.stateUpdate.newSkills) {
                    response.stateUpdate.newSkills.forEach((skill: any) => {
                        learnSkill(skill);
                        addLog({ role: 'system', content: `領悟武學：${skill.name} (${skill.level})` });
                        addNotification({
                            type: 'skill',
                            title: skill.name,
                            description: `境界提升至：${skill.level}`,
                            icon: '⚔️'
                        });
                    });
                }

                // Handle Titles
                if (response.stateUpdate.newTitles) {
                    response.stateUpdate.newTitles.forEach((title: string) => {
                        addTitle(title);
                        addLog({ role: 'system', content: `獲得稱號：${title}` });
                        addNotification({
                            type: 'title',
                            title: title,
                            description: '江湖中開始流傳你的名號...',
                            icon: '🏆'
                        });
                    });
                }
            }

            if (response.options) {
                setOptions(response.options);
            }

            // --- Quest Generation Logic ---
            // Every 15 assistant turns, generate next main quest in background
            const assistantCount = useGameStore.getState().narrative.filter(l => l.role === 'assistant').length;
            if (assistantCount > 0 && assistantCount % 15 === 0) {
                generateNextQuest(useGameStore.getState()).then(quest => {
                    if (quest) {
                        updateWorldState({ mainQuest: quest });
                        addNotification({ type: 'achievement', title: '主線更新', description: quest, icon: '📜' });
                    }
                });
            }

            // --- Rolling Summary Logic ---
            // Check if narrative length is a multiple of 20 and > 0
            if (narrative.length > 0 && narrative.length % 20 === 0) {
                // Get the last 20 logs
                const recentLogs = narrative.slice(-20).map(log =>
                    `${log.role === 'user' ? '玩家' : 'AI'}: ${log.content}`
                ).join('\n');

                // Trigger summary generation in background (fire and forget)
                generateStorySummary(summary, recentLogs).then(result => {
                    if (result && result.text) {
                        try {
                            const json = JSON.parse(result.text);
                            if (json.summary) {
                                updateSummary(json.summary);
                                console.log("Story summary updated:", json.summary);
                                if (result.usage) {
                                    addUsage(result.usage.promptTokenCount || 0, result.usage.candidatesTokenCount || 0);
                                }
                            }
                        } catch (e) {
                            console.error("Failed to parse summary JSON", e);
                        }
                    }
                });
            }

        } catch (error) {
            console.error(error);
            addLog({ role: 'system', content: "The spirits are silent... (API Error)" });
        } finally {
            setProcessing(false);

            // Trigger auto-save after each action (fire-and-forget)
            const storeState = useGameStore.getState();
            void autoSave(storeState.getGameState(), playTime, storeState.sessionId);
        }
    };

    return (
        <div className="flex flex-col border-t border-wuxia-gold/20 bg-gradient-to-b from-black/95 to-wuxia-ink-blue/30 backdrop-blur-xl relative paper-edge pb-4">
            {/* 頂部裝飾線 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-wuxia-gold/40 to-transparent"></div>

            {/* Loading Overlay */}
            {isProcessing && (
                <div className="loading-overlay z-50">
                    <div className="flex flex-col items-center gap-6">
                        {/* 雙環旋轉效果 */}
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border border-wuxia-gold/30 rounded-full animate-spin-slow" />
                            <div className="absolute inset-2 border border-wuxia-gold/50 border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-4 border border-wuxia-bronze/40 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-wuxia-gold/80 text-lg font-serif">運</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-sm text-wuxia-gold font-serif tracking-[0.3em]">天機推演中</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 選項標題 */}
            {options.length > 0 && (
                <div className="flex items-center justify-center gap-3 py-4 opacity-80">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-wuxia-gold/20 to-transparent"></div>
                    <span className="text-[10px] text-wuxia-gold/60 font-serif tracking-widest">抉擇時刻</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-wuxia-gold/20 to-transparent"></div>
                </div>
            )}

            {/* Options Grid (2x2) */}
            {options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 pb-2">
                    {options.slice(0, 4).map((option, idx) => (
                        <button
                            key={option.id || idx}
                            onClick={() => handleAction(option.action || option.label, option.label)}
                            disabled={isProcessing}
                            className={cn(
                                "wuxia-card relative group overflow-hidden p-3 text-left min-h-[4rem]",
                                "flex items-center gap-3",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "animate-slide-up hover:bg-white/5 transition-all"
                            )}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* 編號標記 */}
                            <div className="option-number shrink-0 text-xs w-5 h-5">
                                {idx + 1}
                            </div>

                            {/* 選項內容 */}
                            <div className="flex flex-col gap-0.5 flex-1">
                                <span className="text-sm font-serif text-foreground/90 group-hover:text-wuxia-gold transition-colors line-clamp-2">
                                    {option.label}
                                </span>
                            </div>

                            {/* 懸停裝飾 - 水墨筆觸感 */}
                            <div className="absolute inset-0 bg-gradient-to-r from-wuxia-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </button>
                    ))}
                </div>
            )}



            {/* Empty State / Error */}
            {options.length === 0 && !isProcessing && (
                <div className="p-6 text-center space-y-4">
                    {error ? (
                        <div className="text-red-400">
                            <p className="mb-2">⚠️ {error}</p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-red-900/30 border border-red-500/50 rounded hover:bg-red-900/50 transition-colors text-sm"
                            >
                                重新載入
                            </button>
                        </div>
                    ) : (
                        narrative.length > 1 && (
                            <>
                                <div className="text-wuxia-gold/20 text-2xl">※</div>
                                <p className="text-white/30 text-xs font-serif italic tracking-wide">等待命運的指引...</p>
                            </>
                        )
                    )}
                </div>
            )}

            {/* Custom Action Input */}
            {options.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={customAction}
                                onChange={(e) => setCustomAction(e.target.value.slice(0, 20))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && customAction.trim() && !isProcessing) {
                                        handleAction(customAction.trim());
                                        setCustomAction('');
                                    }
                                }}
                                placeholder="自由行動 (20字內)..."
                                disabled={isProcessing}
                                className="w-full px-4 py-2 bg-black/50 border border-wuxia-gold/30 rounded-sm text-white text-sm font-serif placeholder:text-white/30 focus:border-wuxia-gold focus:outline-none transition-colors disabled:opacity-50"
                                maxLength={20}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono">
                                {customAction.length}/20
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                if (customAction.trim() && !isProcessing) {
                                    handleAction(customAction.trim());
                                    setCustomAction('');
                                }
                            }}
                            disabled={isProcessing || !customAction.trim()}
                            className="px-4 py-2 bg-wuxia-gold/20 border border-wuxia-gold/40 rounded-sm text-wuxia-gold text-sm font-serif hover:bg-wuxia-gold/30 hover:border-wuxia-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            行動
                        </button>
                    </div>
                </div>
            )}

            {/* 底部裝飾 */}
            {options.length > 0 && (
                <div className="flex items-center justify-center gap-2 pb-3 pt-1 opacity-30">
                    <div className="text-[8px] text-wuxia-gold">◆</div>
                    <div className="text-[8px] text-wuxia-gold">◆</div>
                    <div className="text-[8px] text-wuxia-gold">◆</div>
                </div>
            )}
        </div>
    );
}
