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

export const PROVIDER_INFO: Record<AIProvider, { name: string; label: string; apiKeyUrl: string; freeNote?: string }> = {
    gemini: {
        name: 'Google Gemini',
        label: 'Gemini',
        apiKeyUrl: 'https://aistudio.google.com/app/apikey',
        freeNote: '有免費額度',
    },
    grok: {
        name: 'xAI Grok',
        label: 'Grok',
        apiKeyUrl: 'https://console.x.ai/',
        freeNote: '新帳號贈 $25',
    },
    claude: {
        name: 'Anthropic Claude',
        label: 'Claude',
        apiKeyUrl: 'https://console.anthropic.com/',
    },
    deepseek: {
        name: 'DeepSeek',
        label: 'DeepSeek',
        apiKeyUrl: 'https://platform.deepseek.com/api_keys',
        freeNote: '極低費用',
    },
};

interface AIConfigState {
    provider: AIProvider;
    apiKey: string;
    modelName: string;
    isConfigured: boolean;
    setConfig: (provider: AIProvider, apiKey: string, modelName: string) => void;
    clearConfig: () => void;
}

export const useAIConfigStore = create<AIConfigState>()(
    persist(
        (set) => ({
            provider: 'gemini' as AIProvider,
            apiKey: '',
            modelName: 'gemini-2.5-flash-lite',
            isConfigured: false,
            setConfig: (provider, apiKey, modelName) =>
                set({ provider, apiKey, modelName, isConfigured: true }),
            clearConfig: () =>
                set({ provider: 'gemini' as AIProvider, apiKey: '', modelName: 'gemini-2.5-flash-lite', isConfigured: false }),
        }),
        { name: 'jianghu-ai-config' }
    )
);
