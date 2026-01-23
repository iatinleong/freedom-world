import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState } from './types';

export interface SaveSlot {
    id: string;
    name: string;
    gameState: GameState;
    timestamp: number;
    playTime: number; // in seconds
    location: string;
    level: number;
    screenshotData?: string; // base64 image data
}

interface SaveGameStore {
    saves: SaveSlot[];
    autoSaveEnabled: boolean;
    lastAutoSave: number;

    // Actions
    saveGame: (name: string, gameState: GameState, playTime: number) => string;
    loadGame: (id: string) => SaveSlot | null;
    deleteSave: (id: string) => void;
    getSaves: () => SaveSlot[];
    setAutoSaveEnabled: (enabled: boolean) => void;
    autoSave: (gameState: GameState, playTime: number) => void;
}

export const useSaveGameStore = create<SaveGameStore>()(
    persist(
        (set, get) => ({
            saves: [],
            autoSaveEnabled: true,
            lastAutoSave: 0,

            saveGame: (name, gameState, playTime) => {
                const id = crypto.randomUUID();
                const saveSlot: SaveSlot = {
                    id,
                    name,
                    gameState,
                    timestamp: Date.now(),
                    playTime,
                    location: gameState.world.location,
                    level: gameState.player.stats.level,
                };

                set((state) => ({
                    saves: [...state.saves, saveSlot].sort((a, b) => b.timestamp - a.timestamp),
                }));

                return id;
            },

            loadGame: (id) => {
                const save = get().saves.find((s) => s.id === id);
                return save || null;
            },

            deleteSave: (id) => {
                set((state) => ({
                    saves: state.saves.filter((s) => s.id !== id),
                }));
            },

            getSaves: () => {
                return get().saves;
            },

            setAutoSaveEnabled: (enabled) => {
                set({ autoSaveEnabled: enabled });
            },

            autoSave: (gameState, playTime) => {
                const state = get();
                const now = Date.now();

                // Auto-save every 5 minutes
                if (state.autoSaveEnabled && now - state.lastAutoSave > 5 * 60 * 1000) {
                    // Check if there's already an auto-save
                    const existingAutoSave = state.saves.find((s) => s.name === '自動存檔');

                    if (existingAutoSave) {
                        // Update existing auto-save
                        set((state) => ({
                            saves: state.saves.map((s) =>
                                s.name === '自動存檔'
                                    ? {
                                          ...s,
                                          gameState,
                                          timestamp: now,
                                          playTime,
                                          location: gameState.world.location,
                                          level: gameState.player.stats.level,
                                      }
                                    : s
                            ),
                            lastAutoSave: now,
                        }));
                    } else {
                        // Create new auto-save
                        const id = crypto.randomUUID();
                        const saveSlot: SaveSlot = {
                            id,
                            name: '自動存檔',
                            gameState,
                            timestamp: now,
                            playTime,
                            location: gameState.world.location,
                            level: gameState.player.stats.level,
                        };

                        set((state) => ({
                            saves: [...state.saves, saveSlot].sort((a, b) => b.timestamp - a.timestamp),
                            lastAutoSave: now,
                        }));
                    }
                }
            },
        }),
        {
            name: 'jianghu-saves',
        }
    )
);
