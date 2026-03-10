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
        const { data } = await supabase
            .from('user_quotas')
            .select('turns_remaining')
            .eq('user_id', userId)
            .maybeSingle();

        if (!data) {
            // 新用戶：建立初始額度 10
            await supabase
                .from('user_quotas')
                .insert({ user_id: userId, turns_remaining: 10 });
            set({ turnsRemaining: 10, isLoading: false });
        } else {
            set({ turnsRemaining: data.turns_remaining, isLoading: false });
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
