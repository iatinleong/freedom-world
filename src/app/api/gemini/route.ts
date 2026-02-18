import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            systemPrompt,
            userPrompt,
            modelName = 'gemini-2.5-flash-lite',
            provider = 'gemini',
            apiKey: clientApiKey,
        } = body;

        if (!systemPrompt) {
            return NextResponse.json({ error: 'Missing systemPrompt' }, { status: 400 });
        }

        // Resolve API key: use client-provided key first, then env fallback
        const resolvedKey = clientApiKey ||
            process.env.GEMINI_API_KEY ||
            process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

        if (!resolvedKey && provider === 'gemini') {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        if (provider === 'gemini') {
            return await handleGemini(resolvedKey, modelName, systemPrompt, userPrompt);
        }

        if (provider === 'grok') {
            const key = clientApiKey || process.env.GROK_API_KEY || '';
            if (!key) return NextResponse.json({ error: 'Grok API Key not configured' }, { status: 500 });
            return await handleGrok(key, modelName, systemPrompt, userPrompt);
        }

        if (provider === 'claude') {
            const key = clientApiKey || process.env.CLAUDE_API_KEY || '';
            if (!key) return NextResponse.json({ error: 'Claude API Key not configured' }, { status: 500 });
            return await handleClaude(key, modelName, systemPrompt, userPrompt);
        }

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
