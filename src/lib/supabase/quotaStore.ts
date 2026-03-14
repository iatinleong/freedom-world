'use client';

import { create } from 'zustand';
import { supabase } from './client';

interface QuotaStore {
    turnsRemaining: number;
    isLoading: boolean;
    fetchQuota: (userId: string) => Promise<void>;
    consumeTurn: (userId: string) => Promise<void>;
}

export const useQuotaStore = create<QuotaStore>((set, get) => ({
    turnsRemaining: 0,
    isLoading: false,

    fetchQuota: async (userId) => {
        set({ isLoading: true });
        const { data, error } = await supabase
            .from('user_quotas')
            .select('turns_remaining')
            .eq('user_id', userId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching quota:', error);
        }

        // 如果找不到資料，或是資料庫預設值/Trigger錯誤導致剛註冊是0回合，我們補發給他 10 回合
        if (!data || data.turns_remaining === null) {
            const { error: upsertError } = await supabase
                .from('user_quotas')
                .upsert({ user_id: userId, turns_remaining: 10 }, { onConflict: 'user_id' });
            
            if (upsertError) console.error('Error inserting initial quota:', upsertError);
            set({ turnsRemaining: 10, isLoading: false });
        } else {
            let turns = data.turns_remaining;
            
            // 處理某些舊 Trigger 可能將新用戶預設設為 0 的問題
            if (turns === 0) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.created_at) {
                    const createdAt = new Date(user.created_at).getTime();
                    const now = Date.now();
                    const isNewUser = (now - createdAt) < 5 * 60 * 1000; // 5分鐘內註冊
                    
                    if (isNewUser) {
                        turns = 10;
                        await supabase
                            .from('user_quotas')
                            .update({ turns_remaining: 10 })
                            .eq('user_id', userId);
                    }
                }
            }

            set({ turnsRemaining: turns, isLoading: false });
        }
    },

    consumeTurn: async (userId) => {
        const current = get().turnsRemaining;
        if (current <= 0) return;
        const next = current - 1;
        // 先更新本地狀態，再同步資料庫
        set({ turnsRemaining: next });
        await supabase
            .from('user_quotas')
            .update({ turns_remaining: next, updated_at: new Date().toISOString() })
            .eq('user_id', userId);
    },
}));
