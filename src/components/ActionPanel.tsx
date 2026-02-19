'use client';

import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/lib/engine/store';
import { useUsageStore } from '@/lib/engine/usageStore';
import { useSaveGameStore } from '@/lib/engine/saveGameStore';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/engine/prompt';
import { generateGameResponse, generateStageSummary, generateQuestArc } from '@/lib/engine/gemini';
import { cn } from '@/lib/utils';

// Strip markdown code fences that some models wrap around JSON
function parseJSON(text: string) {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
}

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
你是《自由江湖》的頂級說書人，現在要為玩家撰寫武俠小說的「第一章開篇」。
這不是普通的遊戲開場——這是讓玩家立刻沉浸、想繼續讀下去的小說章首。

角色資料：
・姓名：${player.name}（${player.gender === 'male' ? '男' : '女'}）
・膂力${player.stats.attributes.strength} 身法${player.stats.attributes.agility} 根骨${player.stats.attributes.constitution} 悟性${player.stats.attributes.intelligence} 定力${player.stats.attributes.spirit} 福緣${player.stats.attributes.luck} 魅力${player.stats.attributes.charm}

【開篇四要素，缺一不可】
① 身世底蘊（60-80字）
   ・第三人稱，以旁白口吻交代角色的過去：從哪裡來、失去了什麼、帶著什麼執念行走江湖
   ・根骨高→體魄天生異稟但身世坎坷；悟性高→資質驚人卻懷才不遇；福緣高→奇遇不斷卻禍福難料
   ・不要寫「俠客是一個……」，要寫「三年前那場大火……」「江湖人稱……的少年……」這種有畫面感的開頭

② 江湖背景（40-60字）
   ・簡述當前時局：哪個勢力崛起、哪宗懸案未解、武林最近發生了什麼大事
   ・必須是原創設定，不得抄襲金庸版權人物/門派
   ・要與角色的身世有關聯——不是世界背景的堆砌，是「為什麼這件事跟主角有關」

③ 引入危機（80-100字）
   ・在這一刻，一件具體的事把角色捲進了故事的漩渦
   ・要有緊張感：時間緊迫、有人追殺、發現秘密、目睹暗殺、意外捲入恩怨
   ・必須明確：誰、在哪、做了什麼——禁止模糊詞（似乎/彷彿/好像），直接描述

④ 當下場景（60-80字）
   ・主角現在的處境：地點、時辰、天氣、面前有什麼威脅或抉擇
   ・結尾懸念：以一個玩家必須立刻做決定的時刻作結

【敘事規則】
・總字數 280-350 字，一氣呵成，不分段標題
・第三人稱旁白（非第二人稱「你」）僅用於身世/背景段，危機和當下場景切換為第二人稱「你」
・語感：金庸武俠的白話文筆法，乾淨俐落，無廢字
・禁止出現：「似乎」「好像」「彷彿」「可能」「隱約」

只回傳 JSON，格式如下：
{
  "narrative": "第一章開篇（280-350字，包含四要素）",
  "options": [
    { "action": "具體行動描述（10-25字，同時作為按鈕文字）" },
    { "action": "具體行動描述" },
    { "action": "具體行動描述" },
    { "action": "具體行動描述" }
  ],
  "stateUpdate": {
    "location": "具體地點名稱",
    "weather": "天氣描述",
    "newTags": ["地點特徵標籤", "天氣標籤"],
    "mainQuest": "根據開場危機，為玩家設定第一個主線目標（20字以內，具體可執行）",
    "hpChange": 0,
    "qiChange": 0
  }
}
                    `.trim();

                    const { text: responseJson, usage: usageData } = await generateGameResponse(systemPrompt, "開始遊戲");

                    if (usageData) {
                        addUsage(usageData.promptTokenCount || 0, usageData.candidatesTokenCount || 0);
                    }

                    const response = parseJSON(responseJson);

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

                    // Generate quest arc in background (fire-and-forget)
                    generateQuestArc(useGameStore.getState()).then(arc => {
                        if (arc && arc.length > 0) {
                            updateWorldState({ questArc: arc, questArcIndex: 0, mainQuest: arc[0] });
                        }
                    });

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

        const prevOptions = useGameStore.getState().options; // Save for error recovery
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

            const response = parseJSON(responseJson);

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
                    const rawHp = state.player.stats.hp + response.stateUpdate.hpChange;
                    // 主角光環：HP 不得歸零（除非玩家主動求死）
                    updatePlayerStats({ hp: Math.max(1, rawHp) });
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
                if (response.stateUpdate.newLocation) {
                    updateWorld({ location: response.stateUpdate.newLocation });
                }
                if (response.stateUpdate.weatherChange) {
                    updateWorld({ weather: response.stateUpdate.weatherChange });
                }

                // Handle Items (only positive counts — negative counts are a bug from AI)
                if (response.stateUpdate.newItems) {
                    response.stateUpdate.newItems
                        .filter((item: any) => item.count > 0)
                        .forEach((item: any) => {
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

            // --- Quest Arc Advancement (every 6 assistant turns) ---
            const assistantCount = useGameStore.getState().narrative.filter(l => l.role === 'assistant').length;
            if (assistantCount > 0 && assistantCount % 6 === 0) {
                const currentState = useGameStore.getState();
                generateStageSummary(currentState).then(stageSummary => {
                    const ws = getGameState().worldState;
                    const arc = ws.questArc ?? [];
                    const currentIndex = ws.questArcIndex ?? 0;
                    const usedQuests = new Set([...(ws.questHistory ?? []), ws.mainQuest ?? ''].filter(Boolean));

                    // Skip any arc entries already used (dedup protection)
                    let nextIndex = currentIndex + 1;
                    while (nextIndex < arc.length && usedQuests.has(arc[nextIndex])) {
                        nextIndex++;
                    }
                    const nextQuest = arc[nextIndex] ?? null;

                    updateWorldState({
                        mainQuest: nextQuest ?? ws.mainQuest,
                        questHistory: ws.mainQuest
                            ? [...(ws.questHistory ?? []), ws.mainQuest]
                            : (ws.questHistory ?? []),
                        questStageSummaries: ws.mainQuest
                            ? [...(ws.questStageSummaries ?? []), stageSummary ?? '']
                            : (ws.questStageSummaries ?? []),
                        questArcIndex: nextQuest ? nextIndex : currentIndex,
                        questStartTurn: assistantCount,
                    });

                    // Update rolling summary for AI context
                    if (stageSummary) {
                        const prevSummary = useGameStore.getState().summary;
                        updateSummary(prevSummary ? `${prevSummary}\n\n${stageSummary}` : stageSummary);
                    }
                    if (nextQuest) {
                        addNotification({ type: 'achievement', title: '主線推進', description: nextQuest, icon: '📜' });
                    }

                    // When near end of arc, generate next batch in background
                    if (nextIndex >= arc.length - 3) {
                        const stateForArc = useGameStore.getState();
                        generateQuestArc(stateForArc, stateForArc.summary).then(newArc => {
                            if (newArc && newArc.length > 0) {
                                const currentWs = getGameState().worldState;
                                updateWorldState({ questArc: [...(currentWs.questArc ?? []), ...newArc] });
                            }
                        });
                    }
                });
            }

        } catch (error: any) {
            console.error('handleAction error:', error);
            const msg = error.message || 'AI 請求失敗，請稍後再試';
            addNotification({ type: 'system', title: '請求失敗', description: msg, icon: '⚠️' });
            setOptions(prevOptions); // Restore options so player can retry
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
                            onClick={() => handleAction(option.action)}
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
                                    {option.action}
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
