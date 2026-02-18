'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAIConfigStore, PROVIDER_MODELS } from './aiConfigStore';

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
                    // Dynamically look up pricing from the selected model
                    const { provider, modelName } = useAIConfigStore.getState();
                    const models = PROVIDER_MODELS[provider] ?? [];
                    const currentModel = models.find((m) => m.id === modelName);
                    const inputPricePerM = currentModel?.inputPrice ?? 0.10;
                    const outputPricePerM = currentModel?.outputPrice ?? 0.40;

                    const inputCost = (inputTokens / 1_000_000) * inputPricePerM;
                    const outputCost = (outputTokens / 1_000_000) * outputPricePerM;

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
            name: 'freedom-jianghu-usage',
        }
    )
);
