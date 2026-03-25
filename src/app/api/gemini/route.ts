import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60; // seconds (Vercel Hobby max)

const ALLOWED_PROVIDERS = ['gemini', 'grok', 'claude', 'deepseek', 'openai'] as const;

const ALLOWED_MODELS: Record<string, string[]> = {
    gemini:   ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    grok:     ['grok-3-fast', 'grok-3-mini-fast', 'grok-2-1212'],
    claude:   ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    openai:   ['gpt-4o-mini', 'gpt-4o'],
};
const MAX_PROMPT_CHARS = 50_000;

export async function POST(request: Request) {
    try {
        // 1. 驗證登入身份
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.slice(7);

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            systemPrompt,
            userPrompt,
            modelName = 'gemini-2.5-flash-lite',
            provider = 'gemini',
        } = body;

        if (!systemPrompt) {
            return NextResponse.json({ error: 'Missing systemPrompt' }, { status: 400 });
        }

        // 2. 限制 prompt 長度，防止惡意超大 payload 燒費用
        if (
            systemPrompt.length > MAX_PROMPT_CHARS ||
            (userPrompt && userPrompt.length > MAX_PROMPT_CHARS)
        ) {
            return NextResponse.json({ error: 'Prompt too large' }, { status: 400 });
        }

        // 3. Provider allowlist
        if (!ALLOWED_PROVIDERS.includes(provider)) {
            return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
        }

        // 4. Server-side quota check（只對真實遊戲回合，即有 userPrompt 的請求）
        //    自動觸發的輔助呼叫（quest 生成、摘要）沒有 userPrompt，不強制檢查額度
        if (userPrompt) {
            const { data: quota } = await supabase
                .from('user_quotas')
                .select('turns_remaining')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!quota || quota.turns_remaining <= 0) {
                return NextResponse.json({ error: 'No turns remaining' }, { status: 402 });
            }
        }

        const key = process.env.AI_API_KEY || '';
        if (!key) return NextResponse.json({ error: 'AI_API_KEY not configured' }, { status: 500 });

        if (provider === 'gemini') return await handleGemini(key, modelName, systemPrompt, userPrompt);
        if (provider === 'grok') return await handleGrok(key, modelName, systemPrompt, userPrompt);
        if (provider === 'claude') return await handleClaude(key, modelName, systemPrompt, userPrompt);
        if (provider === 'deepseek') return await handleDeepSeek(key, modelName, systemPrompt, userPrompt);
        if (provider === 'openai') return await handleOpenAI(key, modelName, systemPrompt, userPrompt);

        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });

    } catch (error: any) {
        console.error('AI API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

async function handleGemini(apiKey: string, modelName: string, systemPrompt: string, userPrompt?: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
    });

    const fullPrompt = systemPrompt + (userPrompt ? `\n\n${userPrompt}` : '');
    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    const usage = {
        promptTokenCount: result.response.usageMetadata?.promptTokenCount || 0,
        candidatesTokenCount: result.response.usageMetadata?.candidatesTokenCount || 0,
    };
    return NextResponse.json({ text, usage });
}

async function handleGrok(apiKey: string, modelName: string, systemPrompt: string, userPrompt?: string) {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt || '請繼續' },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Grok API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = {
        promptTokenCount: data.usage?.prompt_tokens || 0,
        candidatesTokenCount: data.usage?.completion_tokens || 0,
    };
    return NextResponse.json({ text, usage });
}

async function handleDeepSeek(apiKey: string, modelName: string, systemPrompt: string, userPrompt?: string) {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt || '請繼續' },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`DeepSeek API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = {
        promptTokenCount: data.usage?.prompt_tokens || 0,
        candidatesTokenCount: data.usage?.completion_tokens || 0,
    };
    return NextResponse.json({ text, usage });
}

async function handleOpenAI(apiKey: string, modelName: string, systemPrompt: string, userPrompt?: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt || '請繼續' },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const usage = {
        promptTokenCount: data.usage?.prompt_tokens || 0,
        candidatesTokenCount: data.usage?.completion_tokens || 0,
    };
    return NextResponse.json({ text, usage });
}

async function handleClaude(apiKey: string, modelName: string, systemPrompt: string, userPrompt?: string) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: modelName,
            system: systemPrompt + '\n\n重要：你的回應必須是有效的 JSON 格式，不得包含任何 Markdown 或額外文字。',
            messages: [{ role: 'user', content: userPrompt || '請繼續' }],
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Claude API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const usage = {
        promptTokenCount: data.usage?.input_tokens || 0,
        candidatesTokenCount: data.usage?.output_tokens || 0,
    };
    return NextResponse.json({ text, usage });
}
