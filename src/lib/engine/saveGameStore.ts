import { create } from 'zustand';
import { GameState, NarrativeLog } from './types';
import { supabase } from '@/lib/supabase/client';

export interface SaveSlot {
    id: string;
    name: string;
    gameState: GameState;
    timestamp: number;
    playTime: number;
    location: string;
    level: number;
    isAutoSave?: boolean;
    sessionId?: string;
}

interface SaveGameStore {
    saves: SaveSlot[];
    isLoading: boolean;
    autoSaveEnabled: boolean;
    lastAutoSave: number;

    fetchSaves: () => Promise<void>;
    saveGame: (name: string, gameState: GameState, playTime: number, sessionId: string) => Promise<void>;
    loadGame: (id: string) => Promise<SaveSlot | null>;
    deleteSave: (id: string) => Promise<void>;
    setAutoSaveEnabled: (enabled: boolean) => void;
    autoSave: (gameState: GameState, playTime: number, sessionId: string) => Promise<void>;
    restoreLatestAutoSave: () => Promise<SaveSlot | null>;
    clearNarrative: (sessionId: string) => Promise<void>;
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
        sessionId: (row.session_id as string) ?? undefined,
    };
}

async function syncNarrativeToSupabase(narrative: NarrativeLog[], userId: string, sessionId: string) {
    if (narrative.length === 0) return;
    try {
        await supabase.from('narrative_logs').upsert(
            narrative.map(log => ({
                user_id: userId,
                session_id: sessionId,
                log_id: log.id,
                role: log.role,
                content: log.content,
            })),
            { onConflict: 'session_id,log_id', ignoreDuplicates: true }
        );
    } catch (error) {
        console.error('Failed to sync narrative logs:', error);
    }
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

    saveGame: async (name, gameState, playTime, sessionId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Manual save: store full snapshot (including narrative) for point-in-time restore
        const { data, error } = await supabase
            .from('game_saves')
            .insert({
                user_id: user.id,
                session_id: sessionId,
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
            set(state => ({ saves: [rowToSaveSlot(data), ...state.saves] }));
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

    setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),

    autoSave: async (gameState, playTime, sessionId) => {
        const state = get();
        const now = Date.now();
        if (!state.autoSaveEnabled || now - state.lastAutoSave < 60 * 1000) return;
        set({ lastAutoSave: now });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Strip narrative from game_state — stored separately in narrative_logs
        const { narrative, ...gameStateWithoutNarrative } = gameState;

        try {
            // Upsert auto-save slot (one per session)
            const { data: existing } = await supabase
                .from('game_saves')
                .select('id')
                .eq('user_id', user.id)
                .eq('session_id', sessionId)
                .eq('is_auto_save', true)
                .maybeSingle();

            if (existing) {
                await supabase.from('game_saves').update({
                    game_state: gameStateWithoutNarrative,
                    play_time: playTime,
                    location: gameState.world.location,
                    level: gameState.player.stats.level,
                    updated_at: new Date().toISOString(),
                }).eq('id', existing.id);
            } else {
                await supabase.from('game_saves').insert({
                    user_id: user.id,
                    session_id: sessionId,
                    save_name: '自動存檔',
                    game_state: gameStateWithoutNarrative,
                    play_time: playTime,
                    location: gameState.world.location,
                    level: gameState.player.stats.level,
                    is_auto_save: true,
                });
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }

        // Append only new narrative entries (ON CONFLICT DO NOTHING)
        await syncNarrativeToSupabase(narrative, user.id, sessionId);
    },

    restoreLatestAutoSave: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Find the latest auto-save across all sessions for this user
        const { data: saveData } = await supabase
            .from('game_saves')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_auto_save', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!saveData) return null;

        // Fetch narrative logs for this session (append-only store)
        const { data: narrativeLogs } = await supabase
            .from('narrative_logs')
            .select('*')
            .eq('session_id', saveData.session_id)
            .order('created_at', { ascending: true });

        const narrative: NarrativeLog[] = (narrativeLogs || []).map(row => ({
            id: row.log_id as string,
            role: row.role as 'user' | 'assistant' | 'system',
            content: row.content as string,
            timestamp: new Date(row.created_at as string).getTime(),
        }));

        const gameState: GameState = {
            ...(saveData.game_state as GameState),
            narrative: narrative.length > 0 ? narrative : (saveData.game_state as GameState).narrative ?? [],
        };

        return {
            ...rowToSaveSlot(saveData),
            gameState,
        };
    },

    clearNarrative: async (sessionId: string) => {
        await supabase.from('narrative_logs').delete().eq('session_id', sessionId);
    },
}));
