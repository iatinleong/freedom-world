'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UsageState {
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    sessionCount: number;
}

interface UsageStore extends UsageState {
    addUsage: (inputTokens: number, outputTokens: number) => void;
    resetUsage: () => void;
    incrementSession: () => void;
}

const INITIAL_USAGE: UsageState = {
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    sessionCount: 0,
};

export const useUsageStore = create<UsageStore>()(
    persist(
        (set) => ({
            ...INITIAL_USAGE,

            addUsage: (inputTokens, outputTokens) =>
                set((state) => {
                    // Pricing for Gemini 1.5 Flash (approximate)
                    // Input: $0.075 / 1M tokens
                    // Output: $0.30 / 1M tokens
                    const inputCost = (inputTokens / 1000000) * 0.075;
                    const outputCost = (outputTokens / 1000000) * 0.30;

                    return {
                        totalCost: state.totalCost + inputCost + outputCost,
                        totalInputTokens: state.totalInputTokens + inputTokens,
                        totalOutputTokens: state.totalOutputTokens + outputTokens,
                    };
                }),

            resetUsage: () => set(INITIAL_USAGE),

            incrementSession: () =>
                set((state) => ({ sessionCount: state.sessionCount + 1 })),
        }),
        {
            name: 'freedom-jianghu-usage', // localStorage key
        }
    )
);
