// Client-side AI Helper
// Delegates to Next.js API Route, supports Gemini / Grok / Claude

import { useAIConfigStore } from './aiConfigStore';

function getConfig() {
    const { provider, apiKey, modelName } = useAIConfigStore.getState();
    return { provider, apiKey, modelName };
}

export async function generateGameResponse(systemPrompt: string, userPrompt: string) {
    const { provider, apiKey, modelName } = getConfig();

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userPrompt, modelName, provider, apiKey }),
        });

        if (!response.ok) {
            let errorMsg = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg += ` - ${errorData.error}`;
            } catch (_) { /* ignore */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        return { text: data.text, usage: data.usage };
    } catch (error) {
        console.error('AI Client Error:', error);
        throw error;
    }
}

export async function generateStorySummary(previousSummary: string, newContent: string) {
    const { provider, apiKey, modelName } = getConfig();

    const prompt = `
你是一個專業的劇情摘要助手。
請將以下「舊的劇情摘要」與「新增的劇情對話」合併，重新撰寫成一段約 200 字的流暢劇情摘要。
摘要應包含重要的人名、地點、發生的事件以及當前的處境。
請使用第三人稱，並保留武俠小說的語感。

舊摘要：
${previousSummary || "（無）"}

新增劇情：
${newContent}

請回傳 JSON 格式：
{
  "summary": "合併後的新摘要內容..."
}
    `.trim();

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: prompt, modelName, provider, apiKey }),
        });

        if (!response.ok) {
            console.error('Summary API Error:', response.statusText);
            return null;
        }

        const data = await response.json();
        return { text: data.text, usage: data.usage };
    } catch (error) {
        console.error('Summary Generation Error:', error);
        return null;
    }
}
