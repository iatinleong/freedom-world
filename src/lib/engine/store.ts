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
    learnSkill: (skill: import('./types').MartialArt) => void;
    addTitle: (title: string) => void;
    equipTitle: (title: string) => void;
    loadGameState: (state: GameState, sessionId?: string) => void;
    getGameState: () => GameState;
    setPlayerProfile: (name: string, gender: 'male' | 'female', attributes: import('./types').PlayerStats['attributes']) => void;
    setGameStarted: (started: boolean) => void;
    setCharacterPanelOpen: (isOpen: boolean) => void;
    addNotification: (notification: { type: any, title: string, description: string, icon?: string }) => void;
    isCharacterPanelOpen: boolean;
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
            exp: 0,
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
                seclusion: 0,
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
                '武當': 50, '少林': 50, '丐幫': 50, '峨嵋': 50, '華山': 50,
                '星宿': 50, '五毒': 50, '白駝': 50, '明教': 50, '金蛇遺脈': 50,
                '朝廷': 50, '姑蘇慕容氏': 50, '大理段氏': 50, '雪山派': 50,
                '神龍教': 50, '鐵劍門': 50, '靈鷲宮': 50, '桃花島': 50, '崆峒': 50,
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
    narrative: [
        {
            id: 'init',
            role: 'system',
            content: '夜色昏沉，篝火劈啪作響...',
            timestamp: Date.now(),
        },
    ],
    summary: '',
    options: [],
    isProcessing: false,
    isGameStarted: false,
    isCharacterPanelOpen: false,
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
                            newStats.attributes = {
                                ...currentStats.attributes,
                                ...statsUpdates.attributes
                            };

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
                    // Normalize type: check if it contains 'internal' (case-insensitive) to categorize as internal
                    // otherwise default to 'basics' (which covers external and light)
                    const isInternal = newSkill.type.toLowerCase().includes('internal');
                    const skillType = isInternal ? 'internal' : 'basics';

                    // Clean up the type string for storage (remove parentheses if AI added them)
                    const cleanType = isInternal ? 'internal' : (newSkill.type.toLowerCase().includes('light') ? 'light' : 'external');

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
                // Extract only the GameState properties to save
                const { player, world, system, narrative, options, isProcessing, summary, isGameStarted, isCharacterPanelOpen, usage, notifications } = state;
                return { player, world, system, narrative, options, isProcessing, summary, isGameStarted, isCharacterPanelOpen, usage, notifications };
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

                return {
                    ...currentState,
                    ...persistedState,
                    player: mergedPlayer,
                    isCharacterPanelOpen: false, // Force panel closed on load
                    isProcessing: false, // Force processing false on load
                };
            },
        })
);
