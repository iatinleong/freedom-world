import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'gemini' | 'grok' | 'claude' | 'deepseek';

export interface ModelOption {
    id: string;
    name: string;
    desc: string;
    inputPrice: number;  // USD per 1M tokens
    outputPrice: number; // USD per 1M tokens
    badge?: string;
}

export const PROVIDER_MODELS: Record<AIProvider, ModelOption[]> = {
    gemini: [
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', desc: '最快・最省費用', inputPrice: 0.10, outputPrice: 0.40, badge: '推薦' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: '快速・省費用', inputPrice: 0.10, outputPrice: 0.40 },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: '標準速度・較強能力', inputPrice: 0.10, outputPrice: 0.40 },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: '最新旗艦・品質最佳', inputPrice: 0.30, outputPrice: 2.50 },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: '頂級能力・費用較高', inputPrice: 1.25, outputPrice: 10.00 },
    ],
    grok: [
        { id: 'grok-4-fast-non-reasoning', name: 'Grok 4 Fast', desc: '最省費用', inputPrice: 0.20, outputPrice: 0.50, badge: '推薦' },
        { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast', desc: '最新快速版', inputPrice: 0.20, outputPrice: 0.50 },
        { id: 'grok-4-1-fast-reasoning', name: 'Grok 4.1 Fast Reasoning', desc: '最新推理版', inputPrice: 0.20, outputPrice: 0.50 },
        { id: 'grok-3-mini', name: 'Grok 3 Mini', desc: '輕量・省費用', inputPrice: 0.30, outputPrice: 0.50 },
        { id: 'grok-3', name: 'Grok 3', desc: '標準旗艦', inputPrice: 3.00, outputPrice: 15.00 },
        { id: 'grok-4-0709', name: 'Grok 4', desc: '最強能力', inputPrice: 3.00, outputPrice: 15.00 },
    ],
    claude: [
        { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', desc: '最快・最省費用', inputPrice: 1.00, outputPrice: 5.00, badge: '推薦' },
        { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', desc: '平衡速度與能力', inputPrice: 3.00, outputPrice: 15.00 },
        { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', desc: '頂級能力', inputPrice: 5.00, outputPrice: 25.00 },
    ],
    deepseek: [
        { id: 'deepseek-chat', name: 'DeepSeek V3', desc: '快速・極省費用', inputPrice: 0.27, outputPrice: 1.10, badge: '推薦' },
        { id: 'deepseek-reasoner', name: 'DeepSeek R1', desc: '深度推理・回應較慢', inputPrice: 0.55, outputPrice: 2.19 },
    ],
};

export const PROVIDER_INFO: Record<AIProvider, { name: string; label: string }> = {
    gemini:   { name: 'Google Gemini',    label: 'Gemini'   },
    grok:     { name: 'xAI Grok',         label: 'Grok'     },
    claude:   { name: 'Anthropic Claude', label: 'Claude'   },
    deepseek: { name: 'DeepSeek',         label: 'DeepSeek' },
};

// Configure via environment variables — no UI config screen needed.
// NEXT_PUBLIC_DEFAULT_PROVIDER=deepseek
// NEXT_PUBLIC_DEFAULT_MODEL=deepseek-chat
// DEEPSEEK_API_KEY=sk-xxx  (server-side only, not NEXT_PUBLIC_)
const ENV_PROVIDER = process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as AIProvider | undefined;
const ENV_MODEL    = process.env.NEXT_PUBLIC_DEFAULT_MODEL || '';

const FALLBACK_PROVIDER: AIProvider = 'gemini';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

interface AIConfigState {
    provider: AIProvider;
    modelName: string;
}

export const useAIConfigStore = create<AIConfigState>()(
    persist(
        () => ({
            provider: ENV_PROVIDER ?? FALLBACK_PROVIDER,
            modelName: ENV_MODEL || FALLBACK_MODEL,
        }),
        {
            name: 'jianghu-ai-config',
            merge: (persisted: any, current) => {
                // Env vars always take priority over anything persisted
                if (ENV_PROVIDER) {
                    return {
                        ...current,
                        provider: ENV_PROVIDER,
                        modelName: ENV_MODEL || persisted?.modelName || current.modelName,
                    };
                }
                return { ...current, ...persisted };
            },
        }
    )
);
