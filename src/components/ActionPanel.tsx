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

// Normalize options to ensure each item conforms to the Option interface
// Handles: [{action:"..."}, {label:"..."}, {text:"..."}, "...", null]
function normalizeOptions(raw: any[]): import('../lib/engine/types').Option[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter(opt => opt != null)
        .map((opt, idx) => {
            if (typeof opt === 'string') return { id: String(idx), label: opt, action: opt };
            if (typeof opt === 'object') {
                const action = opt.action || opt.label || opt.text || '';
                return { id: opt.id || String(idx), label: opt.label || action, action };
            }
            return { id: String(idx), label: String(opt), action: String(opt) };
        })
        .filter(opt => opt.action.trim());
}

export function ActionPanel() {
    const { isProcessing, setProcessing, addLog, updatePlayerStats, updateWorld, updateWorldState, updateRelations, updateEquipment, options, setOptions, narrative, getGameState, summary, updateSummary, addItem, removeItem, learnSkill, addTitle, addNotification } = useGameStore();
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
                    // ═══════════════════════════════════════════
                    // STEP 1：生成江湖世界背景
                    // ═══════════════════════════════════════════
                    const worldPrompt = `
你是武俠世界的創世說書人，為《自由江湖》生成一個獨特的武俠江湖世界觀。
以金庸武俠小說的筆法寫作——白話文、有畫面感、人物與勢力鮮活立體。
所有人名、地名、勢力名稱必須完全原創，不得沿用任何現有作品。

【江湖背景要求（200-300字）】
以流暢的第三人稱旁白呈現，涵蓋以下五個面向，一氣呵成，不分標題：
① 時局概述：朝代氛圍、政局穩定與否、官府與江湖的關係
② 主要勢力（6-8個）：各勢力的立場（正道/邪道/中立）、功法特色、當前影響力
③ 勢力關係：誰與誰結盟、誰與誰為敵、誰在擴張或式微
④ 近期江湖大事：1-2件震動武林的事件（懸案/秘笈現世/盟主更迭/滅門血案等）
⑤ 核心矛盾：驅動整個故事世界的主要張力（一句話點明）

只回傳 JSON：
{
  "worldNarrative": "200-300字江湖背景（給玩家看的敘述）",
  "factions": [
    {
      "name": "勢力名稱",
      "alignment": "正道|邪道|中立",
      "philosophy": "門派理念",
      "martialStyle": "功法特色",
      "personality": "待人處事風格",
      "status": "當前處境（強盛/式微/擴張中/內亂/蟄伏）"
    }
  ],
  "centralConflict": "核心矛盾一句話"
}
共6-8個勢力，每個勢力的 philosophy/martialStyle/personality 必須各有特色，不得雷同。
                    `.trim();

                    const { text: worldJson, usage: worldUsage } = await generateGameResponse(worldPrompt, "生成江湖世界");
                    if (worldUsage) addUsage(worldUsage.promptTokenCount || 0, worldUsage.candidatesTokenCount || 0);

                    const worldResponse = parseJSON(worldJson);
                    const worldNarrative: string = worldResponse.worldNarrative || '';
                    const factions: any[] = worldResponse.factions || [];
                    const factionNames = factions.map((f: any) => f.name).join('、') || '江湖散人';

                    // 顯示江湖背景給玩家
                    addLog({ role: 'assistant', content: worldNarrative });
                    // 存入 worldState.worldBackground，供後續所有 prompt 使用
                    updateWorldState({ worldBackground: worldNarrative });

                    // ═══════════════════════════════════════════
                    // STEP 2：生成主角背景故事
                    // ═══════════════════════════════════════════
                    const backstoryPrompt = `
你是《自由江湖》的說書人，根據已建立的江湖世界觀，為玩家生成主角的背景故事。
以金庸武俠小說的筆法寫作——第三人稱旁白，白話文，有畫面感，人物立體鮮活。

江湖世界觀：
${worldNarrative}

主角資料：
・姓名：${player.name}（${player.gender === 'male' ? '男' : '女'}）

【主角背景故事要求（200-300字）】
・第三人稱旁白，一氣呵成，不分段標題
・涵蓋：出身家世、師承門派（必須是上方世界觀中存在的勢力之一，或「江湖散人」）、重要過去事件、核心執念、與當前江湖局勢的個人關聯
・用具體的事件和細節塑造人物，不用抽象描述
・禁止出現：「似乎」「好像」「彷彿」「可能」「隱約」

可選門派（來自上方世界觀）：${factionNames}、江湖散人

只回傳 JSON：
{
  "backstory": "200-300字主角背景",
  "relations": {
    "sect": "所屬門派（必須是世界觀中的勢力或江湖散人）",
    "master": "師父名（無則填「無」）"
  },
  "stateUpdate": {
    "newItems": [{ "id": "唯一id", "name": "物品名", "description": "描述", "type": "weapon|armor|consumable|material|book", "count": 1 }],
    "newSkills": [{ "name": "功法名", "type": "external|internal|light", "rank": "基礎", "level": "初窺門徑" }],
    "initialEquipment": { "weapon": "武器名（無則省略）", "armor": "護甲名（無則省略）" }
  }
}
注意：newItems/newSkills/initialEquipment 僅限背景故事中明確擁有的，若無則省略欄位或回傳空陣列。
                    `.trim();

                    const { text: backstoryJson, usage: backstoryUsage } = await generateGameResponse(backstoryPrompt, "生成主角背景");
                    if (backstoryUsage) addUsage(backstoryUsage.promptTokenCount || 0, backstoryUsage.candidatesTokenCount || 0);

                    const backstoryResponse = parseJSON(backstoryJson);
                    const backstory: string = backstoryResponse.backstory || '';

                    // 顯示主角背景給玩家
                    addLog({ role: 'assistant', content: backstory });
                    // 存入 summary 作為主角前情基底
                    updateSummary(backstory);

                    // 處理門派/師承
                    if (backstoryResponse.relations) {
                        updateRelations({
                            sect: backstoryResponse.relations.sect || '江湖散人',
                            master: backstoryResponse.relations.master || '無',
                        });
                    }
                    // 處理初始物品
                    if (backstoryResponse.stateUpdate?.newItems) {
                        backstoryResponse.stateUpdate.newItems
                            .filter((item: any) => item.count > 0)
                            .forEach((item: any) => addItem(item));
                    }
                    // 處理初始武功
                    if (backstoryResponse.stateUpdate?.newSkills) {
                        backstoryResponse.stateUpdate.newSkills.forEach((skill: any) => learnSkill(skill));
                    }
                    // 處理初始裝備
                    if (backstoryResponse.stateUpdate?.initialEquipment) {
                        const eq = backstoryResponse.stateUpdate.initialEquipment;
                        const equipUpdate: { weapon?: string; armor?: string } = {};
                        if (eq.weapon) equipUpdate.weapon = eq.weapon;
                        if (eq.armor) equipUpdate.armor = eq.armor;
                        if (Object.keys(equipUpdate).length > 0) updateEquipment(equipUpdate);
                    }

                    // ═══════════════════════════════════════════
                    // STEP 3：生成主線劇情弧（await，讓開篇能參考第一章目標）
                    // ═══════════════════════════════════════════
                    const arc = await generateQuestArc(useGameStore.getState(), backstory);
                    const firstQuest = arc?.[0] || '';
                    if (arc && arc.length > 0) {
                        // questStartTurn 設為開篇後的 assistant 數（世界+背景已加 2 個 log）
                        // 開篇 log 會在 Step 4 加入，所以這裡先記錄完成後的起點
                        updateWorldState({ questArc: arc, questArcIndex: 0, mainQuest: arc[0] });
                    }

                    // ═══════════════════════════════════════════
                    // STEP 4：生成開篇場景
                    // ═══════════════════════════════════════════
                    const openingPrompt = `
你是《自由江湖》的說書人，根據世界觀、主角背景與第一章目標，生成玩家進入遊戲的第一幕場景。

江湖世界觀摘要：${worldResponse.centralConflict || worldNarrative.substring(0, 100)}
主角背景：${backstory}
第一章目標：${firstQuest || '踏入江湖'}

【開篇場景要求（80-150字）】
・第二人稱「你」，強烈帶入感
・呈現具體的當下場景：地點、時辰、天氣、感官細節（聲音/氣味/光線）
・氛圍多元，不限打鬥——清晨趕路、市集偶遇、寺廟靜修、客棧等待皆可
・自然銜接第一章目標，結尾留下一個明確的行動起點
・禁止出現：「似乎」「好像」「彷彿」「可能」「隱約」

只回傳 JSON：
{
  "narrative": "80-150字開篇場景",
  "options": [
    { "action": "具體行動（10-20字）" },
    { "action": "具體行動" },
    { "action": "具體行動" },
    { "action": "具體行動" }
  ],
  "stateUpdate": {
    "location": "具體地點名稱",
    "weather": "天氣",
    "newTags": ["地點標籤", "天氣標籤"]
  }
}
                    `.trim();

                    const { text: openingJson, usage: openingUsage } = await generateGameResponse(openingPrompt, "生成開篇場景");
                    if (openingUsage) addUsage(openingUsage.promptTokenCount || 0, openingUsage.candidatesTokenCount || 0);

                    const openingResponse = parseJSON(openingJson);

                    // 顯示開篇場景
                    addLog({ role: 'assistant', content: openingResponse.narrative });

                    if (openingResponse.stateUpdate) {
                        if (openingResponse.stateUpdate.location) updateWorld({ location: openingResponse.stateUpdate.location });
                        if (openingResponse.stateUpdate.weather) updateWorld({ weather: openingResponse.stateUpdate.weather });
                        if (openingResponse.stateUpdate.newTags) updateWorld({ tags: openingResponse.stateUpdate.newTags });
                    }

                    if (openingResponse.options) {
                        setOptions(normalizeOptions(openingResponse.options));
                    }

                    // 設定 questStartTurn：跳過世界背景+主角背景+開篇共3個init log
                    // 讓主線進度計算從第一個真正的玩家操作回合才開始
                    const initLogCount = useGameStore.getState().narrative.filter(l => l.role === 'assistant').length;
                    updateWorldState({ questStartTurn: initLogCount });

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

                // Handle Removed/Consumed Items
                if (response.stateUpdate.removedItems) {
                    response.stateUpdate.removedItems
                        .filter((item: any) => item.count > 0)
                        .forEach((item: any) => {
                            removeItem(item.name, item.count);
                            addLog({ role: 'system', content: `消耗物品：${item.name} x${item.count}` });
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

            // --- Time Advancement (every 3 assistant turns = ~1 shi-chen / 2 hours) ---
            const TIME_PERIODS = ['子時', '丑時', '寅時', '卯時', '辰時', '巳時', '午時', '未時', '申時', '酉時', '戌時', '亥時'];
            const assistantCount = useGameStore.getState().narrative.filter(l => l.role === 'assistant').length;
            if (assistantCount > 0 && assistantCount % 3 === 0) {
                const currentWorld = useGameStore.getState().world;
                const periodIndex = TIME_PERIODS.indexOf(currentWorld.time.period);
                const nextIndex = (periodIndex + 1) % TIME_PERIODS.length;
                const dayAdvance = nextIndex === 0 ? 1 : 0; // 亥時→子時 跨日
                updateWorld({
                    time: {
                        ...currentWorld.time,
                        period: TIME_PERIODS[nextIndex],
                        day: currentWorld.time.day + dayAdvance,
                    },
                });
            }

            // --- Quest Arc Advancement (every 6 gameplay turns, offset from questStartTurn) ---
            const questStartTurn = useGameStore.getState().worldState?.questStartTurn ?? 0;
            const turnsIntoCurrentQuest = assistantCount - questStartTurn;
            if (turnsIntoCurrentQuest > 0 && turnsIntoCurrentQuest % 6 === 0) {
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

        </div>
    );
}
