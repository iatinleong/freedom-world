'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink, ChevronRight } from 'lucide-react';
import { useAIConfigStore, AIProvider, PROVIDER_MODELS, PROVIDER_INFO } from '@/lib/engine/aiConfigStore';

export function AIConfigScreen() {
    const { setConfig } = useAIConfigStore();

    const [provider, setProvider] = useState<AIProvider>('gemini');
    const [modelName, setModelName] = useState('gemini-2.5-flash-lite');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState('');

    const models = PROVIDER_MODELS[provider];
    const info = PROVIDER_INFO[provider];

    const handleProviderChange = (p: AIProvider) => {
        setProvider(p);
        setModelName(PROVIDER_MODELS[p][0].id);
        setError('');
    };

    const handleConfirm = () => {
        if (!apiKey.trim()) {
            setError('請輸入 API Key');
            return;
        }
        setConfig(provider, apiKey.trim(), modelName);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 py-8 overflow-y-auto">
            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="ancient-title text-4xl tracking-[0.5em] text-wuxia-gold drop-shadow-lg mb-2">自由江湖</h1>
                <p className="text-sm text-wuxia-gold/50 tracking-[0.4em] uppercase">Freedom Jianghu</p>
            </div>

            <div className="w-full max-w-lg border border-wuxia-gold/25 bg-black/60 backdrop-blur-sm shadow-2xl">
                {/* Header */}
                <div className="border-b border-wuxia-gold/20 px-6 py-4 bg-wuxia-gold/5">
                    <p className="text-wuxia-gold/80 text-sm tracking-widest text-center">選擇 AI 引擎以進入江湖</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Tabs */}
                    <div>
                        <p className="text-xs text-wuxia-gold/50 tracking-widest mb-3 uppercase">AI 服務商</p>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((p) => {
                                const pi = PROVIDER_INFO[p];
                                const isActive = provider === p;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => handleProviderChange(p)}
                                        className={`py-2.5 px-3 text-sm border transition-all ${
                                            isActive
                                                ? 'border-wuxia-gold bg-wuxia-gold/10 text-wuxia-gold'
                                                : 'border-wuxia-gold/20 text-wuxia-gold/50 hover:border-wuxia-gold/50 hover:text-wuxia-gold/80'
                                        }`}
                                    >
                                        <div className="font-semibold">{pi.label}</div>
                                        {pi.freeNote && (
                                            <div className="text-[10px] mt-0.5 opacity-70">{pi.freeNote}</div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <p className="text-xs text-wuxia-gold/50 tracking-widest mb-3 uppercase">選擇模型</p>
                        <div className="space-y-1.5">
                            {models.map((m) => {
                                const isActive = modelName === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setModelName(m.id)}
                                        className={`w-full flex items-center justify-between px-4 py-3 border text-left transition-all ${
                                            isActive
                                                ? 'border-wuxia-gold/60 bg-wuxia-gold/10 text-wuxia-gold'
                                                : 'border-wuxia-gold/15 text-wuxia-gold/60 hover:border-wuxia-gold/35 hover:text-wuxia-gold/80'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full border ${isActive ? 'bg-wuxia-gold border-wuxia-gold' : 'border-wuxia-gold/40'}`} />
                                            <div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span>{m.name}</span>
                                                    {m.badge && (
                                                        <span className="text-[9px] px-1.5 py-0.5 border border-wuxia-gold/60 text-wuxia-gold/80 tracking-wider">
                                                            {m.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] opacity-60 mt-0.5">{m.desc}</div>
                                            </div>
                                        </div>
                                        <div className="text-right text-[11px] opacity-60 shrink-0 ml-2">
                                            <div>${m.inputPrice.toFixed(2)}</div>
                                            <div>${m.outputPrice.toFixed(2)}</div>
                                            <div className="text-[9px] opacity-50">輸入/輸出</div>
                                            <div className="text-[9px] opacity-50">per 1M</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-wuxia-gold/50 tracking-widest uppercase">API Key</p>
                            <a
                                href={info.apiKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-wuxia-gold/50 hover:text-wuxia-gold/80 transition-colors"
                            >
                                取得 {info.label} API Key
                                <ExternalLink size={10} />
                            </a>
                        </div>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                                placeholder={`輸入 ${info.name} API Key`}
                                className="w-full bg-black/40 border border-wuxia-gold/25 px-4 py-3 pr-12 text-sm text-wuxia-gold/90 placeholder-wuxia-gold/25 outline-none focus:border-wuxia-gold/60 transition-colors font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-wuxia-gold/40 hover:text-wuxia-gold/70 transition-colors"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {error && <p className="text-red-400/80 text-xs mt-2">{error}</p>}
                        <p className="text-wuxia-gold/30 text-[10px] mt-2">
                            API Key 僅儲存於本機瀏覽器，不會傳送至任何第三方伺服器
                        </p>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="w-full py-4 border border-wuxia-gold/60 bg-wuxia-gold/10 text-wuxia-gold tracking-[0.4em] text-sm hover:bg-wuxia-gold/20 hover:border-wuxia-gold transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>踏入江湖</span>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Footer note */}
            <p className="text-wuxia-gold/20 text-[10px] mt-6 text-center tracking-wider">
                每次遊戲動作皆會消耗 AI Token · 建議使用低費用模型
            </p>
        </div>
    );
}
