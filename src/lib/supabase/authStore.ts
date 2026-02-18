import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from './client';

interface AuthStore {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    initialize: () => Promise<void>;
}

function formatError(message: string): string {
    if (message.includes('Invalid login credentials')) return '電郵或密碼錯誤';
    if (message.includes('Email not confirmed')) return '請先驗證電郵地址';
    if (message.includes('User already registered')) return '此電郵已被註冊';
    if (message.includes('Password should be at least')) return '密碼至少需要 6 個字元';
    if (message.includes('Unable to validate email address')) return '電郵格式不正確';
    if (message.includes('signup is disabled')) return '目前不開放註冊';
    return message;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,

    initialize: async () => {
        set({ isLoading: true });
        const { data: { user } } = await supabase.auth.getUser();
        set({ user, isLoading: false });

        supabase.auth.onAuthStateChange((_event, session) => {
            set({ user: session?.user ?? null });
        });
    },

    signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: formatError(error.message) };
        const { data: { user } } = await supabase.auth.getUser();
        set({ user });
        return { error: null };
    },

    signUp: async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: formatError(error.message) };
        return { error: null };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    },
}));
