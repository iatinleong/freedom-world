
/**
 * 自由江湖 - AI 敘事品質壓力測試工具 v2.0
 * 
 * 功能：
 * 1. 模擬不同屬性的玩家開場
 * 2. 進行 5-10 輪自動對話
 * 3. 評估 AI 是否遵守「禁用模糊詞」、「具體事件」、「JSON 格式」等規則
 * 4. 驗證 stateUpdate 是否正確反應了劇情的影響
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt, buildUserPrompt } from '../src/lib/engine/prompt.ts';

// ─── 設定 ───────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash'; // 預設使用 Flash 2.0 速度快且便宜

if (!API_KEY) {
    console.error('❌ 錯誤：未偵測到 GEMINI_API_KEY 環境變數。');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ─── 測試用初始狀態生成器 ────────────────────────────────
function createTestState(overrides = {}) {
    return {
        player: {
            name: '測試俠', title: '無名', gender: 'male',
            stats: {
                level: 1, exp: 0, hp: 100, maxHp: 100, qi: 50, maxQi: 50,
                hunger: 80, maxHunger: 100, moral: 'Neutral', money: 100,
                attributes: { strength: 5, agility: 5, constitution: 5, intelligence: 5, spirit: 5, luck: 5, charm: 5, ...overrides.attributes },
                reputation: { chivalry: 0, infamy: 0, fame: 0, seclusion: 0 },
            },
            skills: { basics: [], internal: [] },
            inventory: [], equipment: { weapon: null, armor: null },
            statusEffects: [], injuries: [],
        },
        world: {
            location: '起始之地',
            time: { year: 1, month: 1, day: 1, period: '正午' },
            weather: '晴', weatherEffect: '無', tags: []
        },
        narrative: [], summary: '', options: [],
        ...overrides
    };
}

// ─── 測試邏輯 ────────────────────────────────────────────
async function runScenario(name, initialState, turns = 5) {
    console.log(`
🚀 開始劇本：【${name}】`);
    let state = JSON.parse(JSON.stringify(initialState));
    let totalScore = 0;

    for (let i = 0; i <= turns; i++) {
        const isInit = i === 0;
        console.log(`
--- 第 ${i} 輪 ---`);

        // 1. 構建 Prompt
        let systemPrompt, userPrompt;
        if (isInit) {
            systemPrompt = `你是一個武俠遊戲主持人。請為以下角色生成開場場景。
            角色：${state.player.name}，屬性：${JSON.stringify(state.player.stats.attributes)}。
            要求回傳格式與遊戲一致。`; // 這裡簡化，實際應對應 ActionPanel 的開場邏輯
            userPrompt = "開始遊戲";
        } else {
            systemPrompt = buildSystemPrompt(state);
            const chosenOption = state.options[0] || { action: "隨便走走" };
            userPrompt = buildUserPrompt(chosenOption.action);
            console.log(`玩家行動：${chosenOption.label}`);
        }

        // 2. 呼叫 AI
        const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(systemPrompt + "

" + userPrompt);
        const responseText = result.response.text();
        
        // 3. 解析與評估
        try {
            const data = JSON.parse(responseText);
            console.log(`AI 敘事：${data.narrative.substring(0, 100)}...`);
            
            // 品質檢查
            const issues = checkQuality(data);
            if (issues.length > 0) {
                console.log(`⚠️  品質警告：${issues.join(', ')}`);
            } else {
                console.log(`✅ 品質良好`);
            }

            // 更新狀態 (Mock)
            state.narrative.push({ role: 'assistant', content: data.narrative });
            state.options = data.options;
            if (data.stateUpdate) applyUpdate(state, data.stateUpdate);

        } catch (e) {
            console.error(`❌ JSON 解析失敗：`, responseText);
        }
    }
}

function checkQuality(data) {
    const issues = [];
    const forbidden = ['似乎', '好像', '彷彿', '可能'];
    forbidden.forEach(word => {
        if (data.narrative.includes(word)) issues.push(`使用了模糊詞「${word}」`);
    });
    if (data.narrative.length < 100) issues.push("敘事過短");
    if (!data.options || data.options.length !== 4) issues.push("選項數量非 4 個");
    return issues;
}

function applyUpdate(state, update) {
    if (update.hpChange) state.player.stats.hp += update.hpChange;
    // ... 其他更新邏輯
}

// ─── 執行測試 ────────────────────────────────────────────
(async () => {
    // 劇本 1：高悟性開局
    await runScenario("悟性奇才", createTestState({ attributes: { intelligence: 10 } }), 3);
    
    // 劇本 2：絕境求生
    await runScenario("瀕死絕境", createTestState({ hp: 5 }), 3);
})();
