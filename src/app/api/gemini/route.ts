import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize API client (Server-side only)
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { systemPrompt, userPrompt, modelName = 'gemini-1.5-flash' } = body;

        if (!systemPrompt) {
            return NextResponse.json({ error: 'Missing prompts' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // Construct the prompt
        // Using generateContent with combined text is standard for this SDK
        const fullPrompt = systemPrompt + (userPrompt ? `\n\n${userPrompt}` : '');
        
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const text = response.text();
        const usage = response.usageMetadata;

        return NextResponse.json({ text, usage });

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
