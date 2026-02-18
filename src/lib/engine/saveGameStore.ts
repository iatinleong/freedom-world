import { create } from 'zustand';
import { GameState } from './types';
import { supabase } from '@/lib/supabase/client';

export interface SaveSlot {
    id: string;
    name: string;
    gameState: GameState;
    timestamp: number;
    playTime: number; // in seconds
    location: string;
    level: number;
    isAutoSave?: boolean;
}

interface SaveGameStore {
    saves: SaveSlot[];
    isLoading: boolean;
    autoSaveEnabled: boolean;
    lastAutoSave: number;

    fetchSaves: () => Promise<void>;
    saveGame: (name: string, gameState: GameState, playTime: number) => Promise<void>;
    loadGame: (id: string) => Promise<SaveSlot | null>;
    deleteSave: (id: string) => Promise<void>;
    setAutoSaveEnabled: (enabled: boolean) => void;
    autoSave: (gameState: GameState, playTime: number) => Promise<void>;
    restoreLatestAutoSave: () => Promise<SaveSlot | null>;
}

function rowToSaveSlot(row: Record<string, unknown>): SaveSlot {
    return {
        id: row.id as string,
        name: row.save_name as string,
        gameState: row.game_state as GameState,
        timestamp: new Date(row.updated_at as string).getTime(),
        playTime: (row.play_time as number) ?? 0,
        location: (row.location as string) ?? '',
        level: (row.level as number) ?? 1,
        isAutoSave: (row.is_auto_save as boolean) ?? false,
    };
}

export const useSaveGameStore = create<SaveGameStore>((set, get) => ({
    saves: [],
    isLoading: false,
    autoSaveEnabled: true,
    lastAutoSave: 0,

    fetchSaves: async () => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('game_saves')
            .select('*')
            .order('updated_at', { ascending: false });
        if (!error && data) {
            set({ saves: data.map(rowToSaveSlot) });
        }
        set({ isLoading: false });
    },

    saveGame: async (name, gameState, playTime) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('game_saves')
            .insert({
                user_id: user.id,
                save_name: name,
                game_state: gameState,
                play_time: playTime,
                location: gameState.world.location,
                level: gameState.player.stats.level,
                is_auto_save: false,
            })
            .select()
            .single();

        if (!error && data) {
            set(state => ({
                saves: [rowToSaveSlot(data), ...state.saves],
            }));
        }
    },

    loadGame: async (id) => {
        const { data, error } = await supabase
            .from('game_saves')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) return null;
        return rowToSaveSlot(data);
    },

    deleteSave: async (id) => {
        await supabase.from('game_saves').delete().eq('id', id);
        set(state => ({ saves: state.saves.filter(s => s.id !== id) }));
    },

    setAutoSaveEnabled: (enabled) => {
        set({ autoSaveEnabled: enabled });
    },

    autoSave: async (gameState, playTime) => {
        const state = get();
        const now = Date.now();
        if (!state.autoSaveEnabled || now - state.lastAutoSave < 60 * 1000) return;

        set({ lastAutoSave: now });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for existing auto-save row
        const { data: existing } = await supabase
            .from('game_saves')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_auto_save', true)
            .single();

        if (existing) {
            await supabase
                .from('game_saves')
                .update({
                    game_state: gameState,
                    play_time: playTime,
                    location: gameState.world.location,
                    level: gameState.player.stats.level,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
        } else {
            await supabase
                .from('game_saves')
                .insert({
                    user_id: user.id,
                    save_name: '自動存檔',
                    game_state: gameState,
                    play_time: playTime,
                    location: gameState.world.location,
                    level: gameState.player.stats.level,
                    is_auto_save: true,
                });
        }
    },

    restoreLatestAutoSave: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
            .from('game_saves')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_auto_save', true)
            .single();

        if (!data) return null;
        return rowToSaveSlot(data);
    },
}));
