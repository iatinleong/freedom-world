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
        if (get().turnsRemaining <= 0) return;
        // 樂觀 UI 更新（先 -1，讓按鈕即時反應）
        set(s => ({ turnsRemaining: s.turnsRemaining - 1 }));
        // DB 端 atomic decrement，不會覆蓋 webhook 寫入的值
        const { data } = await supabase.rpc('decrement_quota', { p_user_id: userId });
        // 若 RPC 回傳實際值，以 DB 為準（修正本地可能的偏差）
        if (typeof data === 'number' && data >= 0) {
            set({ turnsRemaining: data });
        }
    },
}));
