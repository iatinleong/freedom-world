// Client-side AI Helper
// Delegates to Next.js API Route, supports Gemini / Grok / Claude

import { useAIConfigStore } from './aiConfigStore';
import type { GameState } from './types';

function getConfig() {
    const { provider, modelName } = useAIConfigStore.getState();
    return { provider, modelName };
}

export async function generateGameResponse(systemPrompt: string, userPrompt: string) {
    const { provider, modelName } = getConfig();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userPrompt, modelName, provider }),
            signal: controller.signal,
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
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('AI 請求逾時（30秒），請稍後再試');
        }
        console.error('AI Client Error:', error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function generateNextQuest(state: GameState): Promise<string | null> {
    const { provider, modelName } = getConfig();
    const { player, world, summary, worldState } = state;

    const skillStr = [...player.skills.basics, ...player.skills.internal]
        .map(s => s.name).join('、') || '無';

    const prompt = `你是武俠遊戲《自由江湖》的敘事導演。根據當前局勢，為玩家生成下一個主線目標。

當前狀態：
地點：${world.location}
前情摘要：${summary || '（遊戲剛開始）'}
玩家技能：${skillStr}
上一個主線目標：${worldState?.mainQuest || '無'}

要求：
・目標必須與當前地點和狀態自然銜接
・一句話，20字以內，具體可執行（如「前往武當山尋找失蹤的師兄」）
・不能與上一個目標重複，要有明顯的劇情推進感
・帶有懸念，讓玩家知道接下來要做什麼

只回傳 JSON：{"mainQuest": "新的主線目標"}`.trim();

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: prompt, modelName, provider }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        const json = JSON.parse(data.text);
        return json.mainQuest || null;
    } catch {
        return null;
    }
}

export async function generateStorySummary(previousSummary: string, newContent: string) {
    const { provider, modelName } = getConfig();

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: prompt, modelName, provider }),
            signal: controller.signal,
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
    } finally {
        clearTimeout(timeoutId);
    }
}
