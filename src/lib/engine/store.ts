import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, NarrativeLog } from './types';
import { getMartialArtPower, getMartialArtRankPower } from './constants';

interface GameStore extends GameState {
    sessionId: string;
    // Actions
    addLog: (log: Omit<NarrativeLog, 'id' | 'timestamp'>) => void;
    updatePlayerStats: (stats: Partial<GameState['player']['stats']>) => void;
    setProcessing: (isProcessing: boolean) => void;
    updateWorld: (world: Partial<GameState['world']>) => void;
    resetGame: () => void;
    setOptions: (options: import('./types').Option[]) => void;
    startGame: () => Promise<void>;
    updateUsage: (inputTokens: number, outputTokens: number) => void;
    updateSummary: (summary: string) => void;
    addItem: (item: import('./types').Item) => void;
    removeItem: (name: string, count: number) => void;
    learnSkill: (skill: import('./types').MartialArt) => void;
    addTitle: (title: string) => void;
    equipTitle: (title: string) => void;
    updateWorldState: (worldState: Partial<GameState['worldState']>) => void;
    updateRelations: (relations: Partial<GameState['player']['relations']>) => void;
    updateEquipment: (equipment: Partial<GameState['player']['equipment']>) => void;
    loadGameState: (state: GameState, sessionId?: string) => void;
    getGameState: () => GameState;
    setPlayerProfile: (name: string, gender: 'male' | 'female', attributes: import('./types').PlayerStats['attributes']) => void;
    setGameStarted: (started: boolean) => void;
    setCharacterPanelOpen: (isOpen: boolean) => void;
    addNotification: (notification: { type: any, title: string, description: string, icon?: string }) => void;
    isCharacterPanelOpen: boolean;
    isGameMenuOpen: boolean;
    setGameMenuOpen: (isOpen: boolean) => void;
    isQuestPanelOpen: boolean;
    setQuestPanelOpen: (isOpen: boolean) => void;
    notifications: any[];
}

const INITIAL_STATE: GameState = {
    player: {
        name: '俠客',
        title: '無名',
        unlockedTitles: ['無名', '初出茅廬'],
        gender: 'male',
        stats: {
            level: 1,
            hp: 20,
            maxHp: 20,
            qi: 10,
            maxQi: 10,
            hunger: 99,
            maxHunger: 100,
            moral: 'Neutral',
            money: 100,
            attributes: {
                strength: 1,
                agility: 1,
                constitution: 1,
                intelligence: 1,
                spirit: 1,
                luck: 1,
                charm: 1,
            },
            reputation: {
                chivalry: 0,
                infamy: 0,
                fame: 0,
            },
            origin: '出身未定',
            originDefined: false,
        },
        skills: {
            basics: [
                { name: '基礎拳腳', level: '初窺門徑', power: 1.0, type: 'external', rank: '基礎' },
                { name: '基礎劍法', level: '初窺門徑', power: 1.0, type: 'external', rank: '基礎' },
            ],
            internal: [],
            light: [],
        },
        meridians: {
            ren: false, du: false, chong: false, dai: false,
            yinqiao: false, yangqiao: false, yinwei: false, yangwei: false, central: false,
        },
        injuries: [],
        specialSkills: {
            medicine: 0, poison: 0, stealth: 0, insight: 0,
        },
        relations: {
            master: '無',
            sect: '無',
            sectAffinity: {
                // 真實歷史門派（無版權疑慮）
                '武當': 50, '少林': 50, '丐幫': 50, '峨嵋': 50, '華山': 50, '崆峒': 50,
                // 通用勢力
                '朝廷': 50,
                // 原創勢力（本作獨有）
                '天機閣': 50,   // 以謀略情報著稱的神秘組織
                '碧血盟': 50,   // 遊走江湖的義士結盟
                '烈火教': 50,   // 崇尚烈焰、行事激烈的邪道勢力
                '玄冰宗': 50,   // 發源北疆、以冰系內功見長的宗門
                '青鋒劍宗': 50, // 以劍道為核心的正道大派
                '滄瀾幫': 50,   // 控制江河水路、勢力龐大的幫派
                '夜鴉堂': 50,   // 行事隱秘的刺客與暗探聚集地
            },
        },
        inventory: [
            { id: '1', name: '金創藥', description: '治療外傷', type: 'consumable', count: 1 },
            { id: '2', name: '乾糧', description: '恢復飢餓', type: 'consumable', count: 3 },
            { id: '3', name: '草藥', description: '基礎藥材', type: 'material', count: 1 },
        ],
        equipment: {
            weapon: null,
            armor: null,
            accessory: null,
        },
        booksRead: [],
        statusEffects: [],
        companions: [],
    },
    world: {
        location: '外圍山林',
        unlockedLocations: ['外圍山林'],
        time: {
            year: 1,
            month: 1,
            day: 1,
            period: '酉時',
        },
        weather: '濃霧',
        weatherEffect: '暗殺/偷竊成功率+20%，觀察弱點-30%',
        tags: ['濃霧', '深夜', '危險'],
    },
    system: {
        difficulty: '動態難度',
        deathPenalty: true,
    },
    narrative: [],
    summary: '',
    worldState: {
        worldBackground: '',
        mainQuest: '初入江湖，尋找自己的身世線索',
        questHistory: [],
        questStageSummaries: [],
        questArc: [],
        questArcIndex: 0,
        questStartTurn: 0,
        plotProgress: 0,
        pacingCounter: 0,
        currentCombatTurns: 0,
    },
    options: [],
    isProcessing: false,
    isGameStarted: false,
    isCharacterPanelOpen: false,
    isGameMenuOpen: false,
    isQuestPanelOpen: false,
    notifications: [],
    usage: {
        totalCost: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
    },
};

export const useGameStore = create<GameStore>()(
    persist(
        (set, get) => ({
            ...INITIAL_STATE,
            sessionId: crypto.randomUUID(),

            isGameStarted: false,
            isCharacterPanelOpen: false,
            isGameMenuOpen: false,
            isQuestPanelOpen: false,

            setGameMenuOpen: (isOpen) => set({ isGameMenuOpen: isOpen }),
            setQuestPanelOpen: (isOpen) => set({ isQuestPanelOpen: isOpen }),

            addLog: (log) =>
                set((state) => ({
                    narrative: [
                        ...state.narrative,
                        {
                            ...log,
                            id: crypto.randomUUID(),
                            timestamp: Date.now(),
                        },
                    ],
                })),

                updatePlayerStats: (statsUpdates) =>
                    set((state) => {
                        const currentStats = state.player.stats;
                        const newStats = { ...currentStats, ...statsUpdates };
                        
                        // Deep merge attributes if provided
                        if (statsUpdates.attributes) {
                            const ATTR_MAX = 100;
                            const merged = { ...currentStats.attributes, ...statsUpdates.attributes };
                            // Cap all attributes at 20
                            newStats.attributes = Object.fromEntries(
                                Object.entries(merged).map(([k, v]) => [k, Math.min(ATTR_MAX, Math.max(1, v as number))])
                            ) as typeof merged;

                            // --- LOGIC REINFORCEMENT: Derived Stats ---
                            // If constitution (根骨) changes, update maxHp (根骨 x 20)
                            if (statsUpdates.attributes.constitution !== undefined) {
                                newStats.maxHp = newStats.attributes.constitution * 20;
                                // Automatically heal if maxHp increased
                                if (newStats.maxHp > currentStats.maxHp) {
                                    newStats.hp += (newStats.maxHp - currentStats.maxHp);
                                }
                            }
                            
                            // If spirit (定力) changes, update maxQi (定力 x 10)
                            if (statsUpdates.attributes.spirit !== undefined) {
                                newStats.maxQi = newStats.attributes.spirit * 10;
                                if (newStats.maxQi > currentStats.maxQi) {
                                    newStats.qi += (newStats.maxQi - currentStats.maxQi);
                                }
                            }
                        }
            
                        // Deep merge reputation if provided
                        if (statsUpdates.reputation) {
                            newStats.reputation = {
                                ...currentStats.reputation,
                                ...statsUpdates.reputation
                            };
                        }
            
                        return {
                            player: {
                                ...state.player,
                                stats: newStats,
                            },
                        };
                    }),
            setProcessing: (isProcessing) => set({ isProcessing }),

            updateWorld: (world) =>
                set((state) => ({
                    world: { ...state.world, ...world },
                })),

            updateWorldState: (worldState) =>
                set((state) => ({
                    worldState: { ...state.worldState, ...worldState },
                })),

            updateRelations: (relations) =>
                set((state) => ({
                    player: {
                        ...state.player,
                        relations: { ...state.player.relations, ...relations },
                    },
                })),

            updateEquipment: (equipment) =>
                set((state) => ({
                    player: {
                        ...state.player,
                        equipment: { ...state.player.equipment, ...equipment },
                    },
                })),

            setOptions: (options) => set({ options }),

            resetGame: () => set({ ...INITIAL_STATE, sessionId: crypto.randomUUID() }),

            startGame: async () => {
                // Placeholder for component-driven init
            },

            updateUsage: (inputTokens, outputTokens) =>
                set((state) => {
                    // Pricing for Gemini 1.5 Flash (approximate)
                    // Input: $0.075 / 1M tokens
                    // Output: $0.30 / 1M tokens
                    // Note: Pricing tiers exist for >128k context, simplified here for <128k
                    const inputCost = (inputTokens / 1000000) * 0.075;
                    const outputCost = (outputTokens / 1000000) * 0.30;
                    const totalCost = state.usage.totalCost + inputCost + outputCost;

                    return {
                        usage: {
                            totalCost,
                            totalInputTokens: state.usage.totalInputTokens + inputTokens,
                            totalOutputTokens: state.usage.totalOutputTokens + outputTokens,
                        },
                    };
                }),

            updateSummary: (summary) => set({ summary }),

            addItem: (newItem) =>
                set((state) => {
                    const existingItemIndex = state.player.inventory.findIndex(
                        (i) => i.name === newItem.name
                    );

                    let newInventory = [...state.player.inventory];

                    if (existingItemIndex > -1) {
                        // Stack existing item
                        const existingItem = newInventory[existingItemIndex];
                        newInventory[existingItemIndex] = {
                            ...existingItem,
                            count: existingItem.count + newItem.count,
                        };
                    } else {
                        // Add new item with a unique ID if not provided
                        newInventory.push({
                            ...newItem,
                            id: newItem.id || crypto.randomUUID(),
                        });
                    }

                    return {
                        player: {
                            ...state.player,
                            inventory: newInventory,
                        },
                    };
                }),

            learnSkill: (newSkill) =>
                set((state) => {
                    // Normalize type and route to the correct array
                    const rawType = newSkill.type.toLowerCase();
                    const cleanType = rawType.includes('internal') ? 'internal'
                        : rawType.includes('light') ? 'light'
                        : 'external';
                    const skillType = cleanType === 'internal' ? 'internal'
                        : cleanType === 'light' ? 'light'
                        : 'basics';

                    const existingSkillIndex = state.player.skills[skillType].findIndex(
                        (s: any) => s.name === newSkill.name
                    );

                    let newSkillsList = [...state.player.skills[skillType]];



                    // Calculate power based on level name automatically

                    const levelPower = getMartialArtPower(newSkill.level);

                    // Calculate rank power (default to 1.0 if rank is missing)

                    const rankPower = newSkill.rank ? getMartialArtRankPower(newSkill.rank) : 1.0;

                    const totalPower = levelPower * rankPower; // Combine multipliers



                    if (existingSkillIndex > -1) {

                        // Update existing skill level

                        newSkillsList[existingSkillIndex] = {

                            ...newSkillsList[existingSkillIndex],

                            level: newSkill.level,

                            power: totalPower, // Auto-update power

                            type: cleanType, // Ensure type is clean

                            rank: newSkill.rank || newSkillsList[existingSkillIndex].rank || '基礎', // Preserve or update rank

                        };

                    } else {

                        // Learn new skill

                        newSkillsList.push({

                            ...newSkill,

                            power: totalPower, // Auto-set power

                            type: cleanType,

                            rank: newSkill.rank || '基礎', // Default rank

                        });

                    }



                    return {

                        player: {
                            ...state.player,
                            skills: {
                                ...state.player.skills,
                                [skillType]: newSkillsList,
                            },
                        },
                    };
                }),

            removeItem: (name, count) =>
                set((state) => ({
                    player: {
                        ...state.player,
                        inventory: state.player.inventory
                            .map(item => item.name === name
                                ? { ...item, count: item.count - count }
                                : item)
                            .filter(item => item.count > 0),
                    },
                })),

            addTitle: (newTitle) =>
                set((state) => {
                    if (state.player.unlockedTitles.includes(newTitle)) return {}; // Already unlocked
                    return {
                        player: {
                            ...state.player,
                            unlockedTitles: [...state.player.unlockedTitles, newTitle]
                        }
                    };
                }),

            equipTitle: (title) =>
                set((state) => {
                    if (!state.player.unlockedTitles.includes(title)) return {}; // Title not unlocked
                    return {
                        player: {
                            ...state.player,
                            title
                        }
                    };
                }),

            loadGameState: (gameState, sessionId?) => {
                set({
                    ...gameState,
                    // narrative may be missing from auto-saves (stored separately in narrative_logs)
                    narrative: gameState.narrative ?? INITIAL_STATE.narrative,
                    sessionId: sessionId ?? crypto.randomUUID(),
                    isProcessing: false,
                    isCharacterPanelOpen: false,
                    notifications: [],
                });
            },

            setGameStarted: (started) => set({ isGameStarted: started }),



                setCharacterPanelOpen: (isOpen) => set({ isCharacterPanelOpen: isOpen }),



            



                addNotification: (notification) => set((state) => ({



                    notifications: [...state.notifications, { ...notification, id: Math.random().toString(36).substring(7) }]



                })),



            



                setPlayerProfile: (name, gender, attributes) => 



                    set((state) => {



                    // Calculate derived stats



                    const maxHp = attributes.constitution * 20; // 根骨 x 20



                    const maxQi = attributes.spirit * 10;       // 定力 x 10







                    return {



                        player: {



                            ...state.player,



                            name,



                            gender,



                            stats: {



                                ...state.player.stats,



                                hp: maxHp,



                                maxHp: maxHp,



                                qi: maxQi,



                                maxQi: maxQi,



                                attributes



                            }



                        }



                    };



                }),



            getGameState: () => {
                const state = get();
                const { player, world, worldState, system, narrative, options, isProcessing, summary, isGameStarted, isCharacterPanelOpen, isGameMenuOpen, isQuestPanelOpen, usage, notifications } = state;
                return { player, world, worldState, system, narrative, options, isProcessing, summary, isGameStarted, isCharacterPanelOpen, isGameMenuOpen, isQuestPanelOpen, usage, notifications };
            }
        }),
        {
            name: 'freedom-jianghu-storage-v5',
            // Deep merge persisted state with initial state to handle missing fields
            merge: (persistedState: any, currentState: GameStore) => {
                if (!persistedState) return currentState;

                // Deep merge player.stats.attributes to ensure all fields exist
                const mergedAttributes = {
                    ...INITIAL_STATE.player.stats.attributes,
                    ...(persistedState?.player?.stats?.attributes || {}),
                };

                // Deep merge player.stats.reputation
                const mergedReputation = {
                    ...INITIAL_STATE.player.stats.reputation,
                    ...(persistedState?.player?.stats?.reputation || {}),
                };

                // Deep merge player.stats
                const mergedStats = {
                    ...INITIAL_STATE.player.stats,
                    ...(persistedState?.player?.stats || {}),
                    attributes: mergedAttributes,
                    reputation: mergedReputation,
                };

                // Deep merge player
                const mergedPlayer = {
                    ...INITIAL_STATE.player,
                    ...(persistedState?.player || {}),
                    stats: mergedStats,
                    unlockedTitles: persistedState?.player?.unlockedTitles || INITIAL_STATE.player.unlockedTitles,
                };

                // Deep merge worldState to ensure new fields exist
                const mergedWorldState = {
                    ...INITIAL_STATE.worldState,
                    ...(persistedState?.worldState || {}),
                };

                return {
                    ...currentState,
                    ...persistedState,
                    player: mergedPlayer,
                    worldState: mergedWorldState,
                    isCharacterPanelOpen: false, // Force panel closed on load
                    isQuestPanelOpen: false,     // Force panel closed on load
                    isProcessing: false,          // Force processing false on load
                };
            },
        })
);
