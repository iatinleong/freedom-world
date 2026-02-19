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

export async function generateQuestArc(
    state: GameState,
    previousSummary?: string
): Promise<string[] | null> {
    const { provider, modelName } = getConfig();
    const { player, world, summary, worldState } = state;

    const skillStr = [...player.skills.basics, ...player.skills.internal]
        .map(s => s.name).join('、') || '無';

    const existingArc = worldState?.questArc ?? [];
    const lastStages = existingArc.slice(-3).join(' → ');
    const context = previousSummary || summary || '（遊戲剛開始）';

    // Build a deduplicated list of ALL quests that must not be repeated
    const usedQuests = [
        ...(worldState?.questHistory ?? []),
        ...(worldState?.mainQuest ? [worldState.mainQuest] : []),
        ...existingArc,
    ].filter(Boolean);
    const usedStr = usedQuests.length > 0 ? usedQuests.join('、') : null;

    const prompt = `你是武俠小說的主編，正在為《自由江湖》規劃一段冒險弧線（10個章節目標）。

玩家資訊：
・姓名：${player.name}（${player.title}）
・當前地點：${world.location}
・武學：${skillStr}
・劇情背景：${context}
${lastStages ? `・前幾章走向：${lastStages}（請直接接續，不要重複）` : ''}
${usedStr ? `・以下目標已出現，嚴禁重複或相似：【${usedStr}】` : ''}

【核心規則】每個章節是「玩家需要完成的任務目標」，不是「必定發生的事件描述」。
目標告訴玩家「要去哪、做什麼、找誰」，至於過程中遇到什麼由敘事AI自由發揮。

格式要求：
・每章15-20字，格式：「去哪裡 / 對誰 + 做什麼目的」
・✓ 正確：「前往黑風寨打探斷劍下落」「尋找神秘老者問明身世線索」「突破黑衣人重重追殺逃出官道」
・✗ 錯誤：「在官道邂逅老者並學得追蹤術」（這是事件描述，不是目標）
・✗ 錯誤：「繼續探索」「前往某地」（太模糊）
・章節間有邏輯因果：前章的結果導致後章的任務（如「發現賊窩」→「潛入賊窩取物」→「被擒生死一線」）
・節奏起伏：探索→危機→逃脫→反擊→終結
・禁止重複上面列出的已用目標

只回傳 JSON：{"arc": ["目標1", "目標2", "目標3", "目標4", "目標5", "目標6", "目標7", "目標8", "目標9", "目標10"]}`.trim();

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: prompt, modelName, provider }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        const json = JSON.parse(data.text);
        const arc = json.arc;
        if (!Array.isArray(arc) || arc.length === 0) return null;
        return arc.slice(0, 10);
    } catch {
        return null;
    }
}

export async function generateStageSummary(state: GameState): Promise<string | null> {
    const { provider, modelName } = getConfig();
    const { player, narrative, worldState } = state;

    // Build ordered list of assistant turns with their index
    const assistantLogs = narrative.filter(l => l.role === 'assistant');
    const questStartTurn = worldState?.questStartTurn ?? 0;

    // Take only the turns that belong to the current stage (from questStartTurn onward)
    const stageLogs = assistantLogs
        .slice(questStartTurn)  // questStartTurn is the assistant-count index where this stage began
        .map(l => l.content)
        .join('\n\n');

    const prompt = `你是武俠史書的筆錄者。請將以下「${player.name}」的冒險記錄，濃縮成2-3句話的階段摘要。

主線目標：${worldState?.mainQuest || '未知'}
近期事件：
${stageLogs || '（暫無記錄）'}

要求：
・第三人稱，武俠筆法
・保留關鍵人物、地點、重要轉折
・50字以內，言簡意賅

只回傳 JSON：{"summary": "摘要內容"}`.trim();

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: prompt, modelName, provider }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        const json = JSON.parse(data.text);
        return json.summary || null;
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
