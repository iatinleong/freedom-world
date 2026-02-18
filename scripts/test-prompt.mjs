/**
 * 武俠遊戲 Prompt 測試腳本
 *
 * 用法:
 *   GEMINI_API_KEY=xxx node scripts/test-prompt.mjs
 *   GEMINI_API_KEY=xxx node scripts/test-prompt.mjs --turns=8
 *   GEMINI_API_KEY=xxx GEMINI_MODEL=gemini-2.5-flash node scripts/test-prompt.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── 設定 ───────────────────────────────────────────────
const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const MODEL   = process.env.GEMINI_MODEL   || 'gemini-2.5-flash-lite';
const TURNS   = parseInt(process.argv.find(a => a.startsWith('--turns='))?.split('=')[1] ?? '5');

if (!API_KEY) {
    console.error('\n❌ 請設定 GEMINI_API_KEY 環境變數');
    console.error('   GEMINI_API_KEY=your_key node scripts/test-prompt.mjs\n');
    process.exit(1);
}

// ─── 武學常數 ────────────────────────────────────────────
const MARTIAL_ART_LEVELS = [
    { name: '初窺門徑', power: 1.0 }, { name: '略有小成', power: 1.2 },
    { name: '駕輕就熟', power: 1.5 }, { name: '融會貫通', power: 2.0 },
    { name: '爐火純青', power: 3.0 }, { name: '出神入化', power: 5.0 },
    { name: '返璞歸真', power: 10.0 }, { name: '震古爍今', power: 20.0 },
];
const MARTIAL_ART_RANKS = [
    { name: '基礎', power: 1.0 }, { name: '進階', power: 1.5 },
    { name: '上乘', power: 2.0 }, { name: '絕世', power: 3.0 }, { name: '神功', power: 5.0 },
];

// ─── 初始遊戲狀態 ────────────────────────────────────────
let state = {
    player: {
        name: '李無涯', title: '無名小卒', gender: 'male',
        stats: {
            level: 1, exp: 0,
            hp: 100, maxHp: 100, qi: 80, maxQi: 80,
            hunger: 80, maxHunger: 100, moral: 'Neutral', money: 50,
            attributes: { strength: 6, agility: 8, constitution: 5, intelligence: 7, spirit: 4, luck: 9, charm: 6 },
            reputation: { chivalry: 0, infamy: 0, fame: 0, seclusion: 0 },
            origin: '', originDefined: false,
        },
        skills: {
            basics: [{ name: '基礎刀法', level: '初窺門徑', rank: '基礎', power: 1.0, type: 'external' }],
            internal: [],
        },
        inventory: [{ id: '1', name: '乾糧', count: 3, type: 'consumable', description: '普通乾糧' }],
        equipment: { weapon: '普通鐵刀', armor: null, accessory: null },
        statusEffects: [], injuries: [], companions: [],
        specialSkills: { medicine: 0, poison: 0, stealth: 0, insight: 0 },
        meridians: { ren:false,du:false,chong:false,dai:false,yinqiao:false,yangqiao:false,yinwei:false,yangwei:false,central:false },
        relations: { master: '', sect: '', sectAffinity: {} },
        booksRead: [], unlockedTitles: [],
    },
    world: {
        location: '未知', unlockedLocations: [],
        time: { year: 1, month: 3, day: 5, period: '巳時' },
        weather: '晴', weatherEffect: '無特殊效果', tags: [],
    },
    narrative: [], summary: '',
    system: { difficulty: 'normal', deathPenalty: false },
    options: [], isGameStarted: true, isCharacterPanelOpen: false,
    notifications: [], isProcessing: false,
    usage: { totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0 },
};

// ─── Prompt Builder (與 prompt.ts 保持一致) ──────────────
function buildSystemPrompt(s) {
    const { player, world, narrative, summary } = s;
    const levelsStr = MARTIAL_ART_LEVELS.map(l => `${l.name}(x${l.power})`).join('・');
    const ranksStr  = MARTIAL_ART_RANKS.map(r => `${r.name}(x${r.power})`).join('・');
    const recentHistory = narrative
        .filter(log => log.role !== 'system')
        .slice(-4)
        .map(log => log.role === 'user' ? `【玩家】${log.content}` : `【敘事】${log.content.substring(0, 150)}`)
        .join('\n');
    const skillStr = [...player.skills.basics, ...player.skills.internal]
        .map(s => `${s.name}(${s.level})`).join('、') || '無';

    return `你是《自由江湖》的說書人兼遊戲主持人，掌管這個殘酷而真實的武俠世界。

━━ 前情提要 ━━
${summary || '（遊戲剛開始）'}

━━ 近期劇情 ━━
${recentHistory || '（暫無）'}

━━ 當前狀態 ━━
地點：${world.location}｜${world.time.period}｜${world.weather}（${world.weatherEffect}）
環境標籤：[${world.tags.join(', ')}]
角色：${player.name}（${player.title}）Lv.${player.stats.level}
氣血 ${player.stats.hp}/${player.stats.maxHp}｜內力 ${player.stats.qi}/${player.stats.maxQi}｜飢餓 ${player.stats.hunger}/${player.stats.maxHunger}｜道德 ${player.stats.moral}
膂力${player.stats.attributes.strength} 身法${player.stats.attributes.agility} 根骨${player.stats.attributes.constitution} 悟性${player.stats.attributes.intelligence} 定力${player.stats.attributes.spirit} 福緣${player.stats.attributes.luck} 魅力${player.stats.attributes.charm}
聲望：俠義${player.stats.reputation.chivalry} 惡名${player.stats.reputation.infamy} 威名${player.stats.reputation.fame} 隱逸${player.stats.reputation.seclusion}
武學：${skillStr}
裝備：武器[${player.equipment.weapon || '無'}] 防具[${player.equipment.armor || '無'}]
物品：${player.inventory.map(i => `${i.name}x${i.count}`).join('、') || '無'}
狀態異常：${player.statusEffects.length ? player.statusEffects.join('、') : '無'}

━━ 武學體系 ━━
品階（高→低）：${ranksStr}
境界（低→高）：${levelsStr}

━━ 敘事準則 ━━
每次回應必須：
・有一件具體的「事」發生——NPC開口、局面突變、發現線索、戰鬥爆發、陷阱觸發
・長度 120～200 字，精煉有力不囉嗦
・包含感官細節（聲音、氣味、觸感），不只是視覺描寫
・NPC有個性、動機、當下的情緒，不是場景道具
・天氣與地形實際影響劇情（雨天路滑、夜間視線差、酷熱影響體力）

絕對禁止：
・「似乎」「可能」「隱約」等模糊詞——直接給明確結果
・玩家停在原地，情況毫無改變
・同一情境連續超過3回合——強制給出結局（逃了/被捉/轉折）
・連續兩次描寫完全相同的氛圍

屬性判定參考：
膂力→外功傷害/破防 | 身法→閃避/逃跑/偷襲 | 根骨→防禦/中毒抵抗
悟性→識破弱點/學功速度 | 定力→抗威壓/心魔 | 福緣→奇遇/隱藏物品 | 魅力→NPC態度/交易折扣

━━ 選項設計準則 ━━
提供 4 個選項，對應四種不同的應對哲學：
1. 主動強硬型——有明確風險，但可能有高回報
2. 謹慎觀察型——較安全，資訊導向
3. 社交斡旋型——利用口才、魅力或道義影響局勢
4. 奇招創意型——出人意料，利用環境、物品或意外角度

每個選項都要讓玩家覺得「選哪個都有點可惜」。
禁止出現：「繼續走」「再觀察一下」「等待」「離開」這類無意義選項。
label 是玩家看到的文字（10-20字），action 是這個選項的詳細行動描述（送給你作為下一回合的 prompt）。

━━ 輸出格式 ━━
只輸出 JSON，無 Markdown。stateUpdate 只填有實際變化的欄位，數值為 0 的欄位一律省略不寫。

{
  "narrative": "（120-200字，必有具體事件發生）",
  "options": [
    { "label": "拔刀攔住去路", "action": "霍然起身，右手按住刀柄，擋在那蒙面人必經之路上，沉聲喝問他的身分來歷" },
    { "label": "悄悄跟上去", "action": "壓低身形，踩著軟底靴，保持三丈距離悄悄跟蹤那蒙面人，看他究竟去往何處" },
    { "label": "向茶館掌柜打聽", "action": "走到掌柜身旁，壓低聲音，假裝點茶，趁機打聽那蒙面人的來歷和近日動靜" },
    { "label": "假裝醉倒在他必經處", "action": "趁人不注意，倒在那蒙面人的必經之路上裝作酒醉，等他靠近時再相機行事" }
  ],
  "stateUpdate": {
    "hungerChange": -1,
    "hpChange": -15,
    "qiChange": -10,
    "expChange": 10,
    "newItems": [{ "name": "物品名", "count": 1, "type": "consumable", "description": "簡短描述" }],
    "newSkills": [{ "name": "武功名", "type": "internal", "rank": "基礎", "level": "初窺門徑" }],
    "newTitles": ["江湖人稱的稱號"],
    "newTags": ["新增的環境標籤"],
    "removedTags": ["要移除的環境標籤"],
    "attributeChanges": { "strength": 1 },
    "reputationChanges": { "chivalry": 5 }
  }
}

注意：上面的 stateUpdate 是完整欄位示例。實際輸出只需包含這回合真正有變化的欄位。
普通的行走、觀察，hungerChange 填 -1 即可，其他不變的欄位不必出現。`.trim();
}

function buildUserPrompt(action) {
    return `玩家行動：「${action}」\n\n根據此行動推進劇情，給出明確結果。`.trim();
}

function buildInitPrompt(player) {
    return `你是《自由江湖》的說書人。現在為以下角色生成一個武俠開場場景。

角色設定：
・姓名：${player.name}（${player.gender === 'male' ? '男' : '女'}）
・膂力${player.stats.attributes.strength} 身法${player.stats.attributes.agility} 根骨${player.stats.attributes.constitution} 悟性${player.stats.attributes.intelligence} 定力${player.stats.attributes.spirit} 福緣${player.stats.attributes.luck} 魅力${player.stats.attributes.charm}

開場要求：
1. 隨機選擇地點（城鎮/山野/古道/渡口/客棧/廢墟/山洞……任意）、天氣、時辰
2. 場景必須立刻有張力——不是「在路上走」，而是：剛目睹一件事、被人攔截、聽到奇怪聲音、發現異常、遭遇突發狀況
3. 劇情要體現角色屬性（悟性高→觀察敏銳，福緣高→意外發現寶物，魅力高→引人注意……）
4. 長度 150-200 字，有具體的人物或事件出現
5. 提供 4 個截然不同的選項（主動應對 / 謹慎觀察 / 社交斡旋 / 奇招創意）

只回傳 JSON，格式如下：
{
  "narrative": "開場劇情（150-200字，必有具體事件）",
  "options": [
    { "label": "玩家看到的選項文字", "action": "這個選項的詳細行動描述，作為下一回合的prompt" },
    { "label": "玩家看到的選項文字", "action": "詳細行動描述" },
    { "label": "玩家看到的選項文字", "action": "詳細行動描述" },
    { "label": "玩家看到的選項文字", "action": "詳細行動描述" }
  ],
  "stateUpdate": {
    "location": "具體地點名稱",
    "weather": "天氣描述",
    "newTags": ["地點特徵標籤", "天氣標籤"]
  }
}`.trim();
}

// ─── 評估函式 ────────────────────────────────────────────
const FILLER_WORDS   = ['似乎', '好像', '彷彿', '可能', '隱約', '大概', '也許', '或許', '繼續走', '觀察四周', '原地等待', '默默等待'];
const ZERO_FIELDS    = ['hpChange', 'qiChange', 'hungerChange', 'expChange', 'moral'];
const VALID_ATTRS    = new Set(['strength', 'agility', 'constitution', 'intelligence', 'spirit', 'luck', 'charm']);
const VALID_REPS     = new Set(['chivalry', 'infamy', 'fame', 'seclusion']);

function evaluate(parsed, raw, turnLabel) {
    const issues   = [];
    const warnings = [];
    const good     = [];

    // 1. JSON 解析
    good.push('JSON 解析成功');

    // 2. narrative 長度
    const narrative = parsed.narrative || '';
    const len = narrative.length;
    if (len < 80)  issues.push(`narrative 太短（${len}字，要求 120-200）`);
    else if (len > 320) warnings.push(`narrative 偏長（${len}字，要求 120-200）`);
    else good.push(`narrative 長度合適（${len}字）`);

    // 3. 模糊詞
    const fillerFound = FILLER_WORDS.filter(w => narrative.includes(w));
    if (fillerFound.length > 0) issues.push(`出現禁用模糊詞：${fillerFound.join('、')}`);
    else good.push('無模糊詞');

    // 4. stateUpdate 零值檢查
    const su = parsed.stateUpdate || {};
    const zeroFields = ZERO_FIELDS.filter(f => f in su && su[f] === 0);
    if (zeroFields.length > 0) warnings.push(`stateUpdate 有零值欄位（應省略）：${zeroFields.join(', ')}`);
    else good.push('stateUpdate 無多餘零值');

    // 5. attributeChanges key 名稱驗證
    const attrChanges = su.attributeChanges || {};
    const invalidAttrs = Object.keys(attrChanges).filter(k => !VALID_ATTRS.has(k));
    const zeroAttrs    = Object.entries(attrChanges).filter(([,v]) => v === 0).map(([k]) => k);
    if (invalidAttrs.length > 0) issues.push(`attributeChanges 用了錯誤的 key：${invalidAttrs.join(', ')}（應用 strength/agility/constitution/intelligence/spirit/luck/charm）`);
    if (zeroAttrs.length > 0)    warnings.push(`attributeChanges 含零值屬性（應省略）：${zeroAttrs.join(', ')}`);
    if (invalidAttrs.length === 0 && zeroAttrs.length === 0) good.push('attributeChanges key 正確');

    // 6. reputationChanges key 名稱驗證
    const repChanges = su.reputationChanges || {};
    const invalidReps = Object.keys(repChanges).filter(k => !VALID_REPS.has(k));
    if (invalidReps.length > 0) issues.push(`reputationChanges 用了錯誤的 key：${invalidReps.join(', ')}（應用 chivalry/infamy/fame/seclusion）`);

    // 7. options 數量與 action 欄位品質
    const options = parsed.options || [];
    if (options.length < 4) issues.push(`只有 ${options.length} 個選項（要求4個）`);
    else good.push('選項數量正確（4個）');

    const badActions = options.filter(o => !o.action || o.action.length < 15 || /^action_\d+$/.test(o.action));
    if (badActions.length > 0) {
        issues.push(`${badActions.length} 個 action 欄位過短或無意義（要求30字以上）`);
    } else {
        good.push('action 欄位有實質內容');
    }

    // 8. label 廢話選項偵測與長度
    const BORING_LABELS = ['繼續走', '繼續前行', '再觀察', '等待', '離開', '不管', '原地'];
    const boringLabels  = options.filter(o => BORING_LABELS.some(b => (o.label || '').includes(b)));
    if (boringLabels.length > 0) warnings.push(`選項有廢話 label：${boringLabels.map(o => `"${o.label}"`).join(', ')}`);
    else good.push('選項 label 無廢話');

    const labels       = options.map(o => o.label || '');
    const avgLabelLen  = labels.reduce((s, l) => s + l.length, 0) / (labels.length || 1);
    const shortLabels  = labels.filter(l => l.length < 4);
    if (shortLabels.length > 0) warnings.push(`${shortLabels.length} 個 label 過短（<4字）：${shortLabels.map(l=>`"${l}"`).join(', ')}`);
    else good.push(`label 平均長度 ${avgLabelLen.toFixed(1)} 字`);

    // 9. 事件檢測
    const hasDialogue = /「|道：|喝道|笑道|冷道|罵道|怒道/.test(narrative);
    const hasAction   = /劈|刺|踢|躍|拔|抓|撲|倒|跌|奔|逃|撞|砍|出手|揮|格擋/.test(narrative);
    const hasEvent    = hasDialogue || hasAction || narrative.includes('突然') || narrative.includes('猛然') || narrative.includes('緊接著');
    if (!hasEvent) warnings.push('narrative 可能缺乏具體事件（無對話、無動作動詞）');
    else good.push(`有具體事件（${hasDialogue ? '含對話' : ''}${hasAction ? ' 含動作' : ''}）`);

    // 輸出結果
    const score = good.length - issues.length * 2 - warnings.length * 0.5;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📋 ${turnLabel} 評估`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`\n📖 Narrative:\n${narrative}\n`);
    console.log(`🎯 選項:`);
    options.forEach((o, i) => {
        const labelLen  = (o.label || '').length;
        const actionLen = (o.action || '').length;
        const labelMark = labelLen < 4 ? '⚠️ ' : '';
        const actionMark= actionLen < 15 ? '⚠️ ' : '';
        console.log(`  ${i+1}. ${labelMark}[${o.label}]（${labelLen}字）`);
        console.log(`     ${actionMark}→ ${(o.action||'').substring(0,70)}${actionLen>70?'…':''}`);
    });
    if (Object.keys(su).length > 0) {
        console.log(`\n⚙️  StateUpdate: ${JSON.stringify(su)}`);
    }
    console.log(`\n✅ 通過 (${good.length}): ${good.join(' | ')}`);
    if (warnings.length) console.log(`⚠️  警告 (${warnings.length}): ${warnings.join(' | ')}`);
    if (issues.length)   console.log(`❌ 問題 (${issues.length}): ${issues.join(' | ')}`);
    console.log(`\n🏆 本回合得分: ${score.toFixed(1)}`);

    return { score, issues, warnings, good };
}

// ─── API 呼叫 ────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(API_KEY);

async function callAI(prompt, userPrompt = '') {
    const model = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig: { responseMimeType: 'application/json' },
    });
    const full = prompt + (userPrompt ? `\n\n${userPrompt}` : '');
    const result = await model.generateContent(full);
    const text = result.response.text();
    const usage = result.response.usageMetadata;
    return { text, usage };
}

// ─── 狀態更新 ────────────────────────────────────────────
function applyStateUpdate(su) {
    if (!su) return;
    if (su.hpChange)     state.player.stats.hp     = Math.max(0, state.player.stats.hp     + su.hpChange);
    if (su.qiChange)     state.player.stats.qi     = Math.max(0, state.player.stats.qi     + su.qiChange);
    if (su.hungerChange) state.player.stats.hunger = Math.max(0, state.player.stats.hunger + su.hungerChange);
    if (su.expChange)    state.player.stats.exp    += su.expChange;
    if (su.location)     state.world.location = su.location;
    if (su.weather)      state.world.weather  = su.weather;
    if (su.newTags)      state.world.tags = [...new Set([...state.world.tags, ...su.newTags])];
    if (su.removedTags)  state.world.tags = state.world.tags.filter(t => !su.removedTags.includes(t));
    if (su.attributeChanges) {
        Object.entries(su.attributeChanges).forEach(([k, v]) => {
            if (k in state.player.stats.attributes) state.player.stats.attributes[k] += v;
        });
    }
    if (su.reputationChanges) {
        Object.entries(su.reputationChanges).forEach(([k, v]) => {
            if (k in state.player.stats.reputation) state.player.stats.reputation[k] += v;
        });
    }
    if (su.newItems) su.newItems.forEach(item => state.player.inventory.push({ id: Date.now().toString(), ...item }));
    if (su.newTitles) su.newTitles.forEach(t => { if (!state.player.unlockedTitles.includes(t)) state.player.unlockedTitles.push(t); });
}

function addLog(role, content) {
    state.narrative.push({ id: Date.now().toString(), role, content, timestamp: Date.now() });
}

// ─── 行動序列（測試不同風格的選擇） ───────────────────────
// null = 自動取 options[0]（主動型），字串 = 自由輸入
const ACTION_SEQUENCE = [
    null,                           // Turn 1: 主動型選項
    null,                           // Turn 2: 主動型選項（看後續發展）
    '我掏出一錢銀子，遞給對方，說：「這位朋友，有話好說。」', // Turn 3: 自由輸入（社交）
    null,                           // Turn 4: 主動型
    '拔出鐵刀，大喝一聲，衝上去',   // Turn 5: 自由輸入（戰鬥）
];

// ─── 主程序 ──────────────────────────────────────────────
async function main() {
    console.log('═'.repeat(60));
    console.log(`🎮 武俠遊戲 Prompt 測試腳本`);
    console.log(`   模型: ${MODEL} | 測試回合: ${TURNS}`);
    console.log('═'.repeat(60));

    const allResults = [];
    let totalTokens = 0;

    // ── Turn 0: 開場 ──
    console.log('\n⏳ 生成開場場景...');
    const initPrompt = buildInitPrompt(state.player);
    const { text: initText, usage: initUsage } = await callAI(initPrompt, '開始遊戲');
    totalTokens += (initUsage?.promptTokenCount || 0) + (initUsage?.candidatesTokenCount || 0);

    let parsed;
    try {
        parsed = JSON.parse(initText);
    } catch (e) {
        console.error('❌ 開場 JSON 解析失敗:', initText);
        process.exit(1);
    }

    addLog('assistant', parsed.narrative);
    applyStateUpdate(parsed.stateUpdate);
    state.options = parsed.options || [];

    const r0 = evaluate(parsed, initText, '開場（Turn 0）');
    allResults.push({ turn: 0, ...r0 });

    // ── Turns 1~N ──
    for (let turn = 1; turn <= TURNS; turn++) {
        // 選擇行動
        let chosenAction;
        const customAction = ACTION_SEQUENCE[turn - 1];
        if (customAction) {
            chosenAction = customAction;
            console.log(`\n⏳ Turn ${turn}（自由輸入）: 「${chosenAction}」`);
        } else if (state.options.length > 0) {
            // 交替選擇主動型(0)和奇招型(3)
            const idx = turn % 2 === 1 ? 0 : 3;
            const opt = state.options[Math.min(idx, state.options.length - 1)];
            chosenAction = opt.action;
            console.log(`\n⏳ Turn ${turn}（選項${Math.min(idx,state.options.length-1)+1}）: [${opt.label}]`);
        } else {
            chosenAction = '繼續探索';
            console.log(`\n⏳ Turn ${turn}（無選項，預設）: ${chosenAction}`);
        }

        addLog('user', chosenAction);

        const sys  = buildSystemPrompt(state);
        const user = buildUserPrompt(chosenAction);

        let turnText, turnUsage;
        try {
            ({ text: turnText, usage: turnUsage } = await callAI(sys, user));
            totalTokens += (turnUsage?.promptTokenCount || 0) + (turnUsage?.candidatesTokenCount || 0);
        } catch (e) {
            console.error(`❌ Turn ${turn} API 失敗:`, e.message);
            break;
        }

        try {
            parsed = JSON.parse(turnText);
        } catch (e) {
            console.error(`❌ Turn ${turn} JSON 解析失敗:`, turnText.substring(0, 200));
            allResults.push({ turn, score: -10, issues: ['JSON 解析失敗'], warnings: [], good: [] });
            continue;
        }

        addLog('assistant', parsed.narrative);
        applyStateUpdate(parsed.stateUpdate);
        state.options = parsed.options || [];

        const result = evaluate(parsed, turnText, `Turn ${turn}`);
        allResults.push({ turn, ...result });

        // 避免 rate limit
        if (turn < TURNS) await new Promise(r => setTimeout(r, 1000));
    }

    // ─── 總結報告 ───────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('📊 總結報告');
    console.log('═'.repeat(60));

    const totalScore = allResults.reduce((s, r) => s + r.score, 0);
    const avgScore   = totalScore / allResults.length;
    const allIssues  = allResults.flatMap(r => r.issues);
    const allWarnings= allResults.flatMap(r => r.warnings);

    console.log(`\n平均得分: ${avgScore.toFixed(2)} / ${allResults.length} 回合`);
    console.log(`Token 消耗: ~${totalTokens} tokens`);

    // 統計各問題出現次數
    const issueCounts = {};
    allIssues.forEach(i => { const k = i.split('（')[0]; issueCounts[k] = (issueCounts[k]||0) + 1; });
    const warnCounts  = {};
    allWarnings.forEach(w => { const k = w.split('（')[0]; warnCounts[k] = (warnCounts[k]||0) + 1; });

    console.log('\n❌ 反覆出現的問題（按頻率）:');
    if (Object.keys(issueCounts).length === 0) {
        console.log('  （無重大問題）');
    } else {
        Object.entries(issueCounts).sort((a,b)=>b[1]-a[1])
            .forEach(([k,v]) => console.log(`  × ${k}（${v}/${allResults.length} 回合）`));
    }

    console.log('\n⚠️  反覆出現的警告:');
    if (Object.keys(warnCounts).length === 0) {
        console.log('  （無警告）');
    } else {
        Object.entries(warnCounts).sort((a,b)=>b[1]-a[1])
            .forEach(([k,v]) => console.log(`  △ ${k}（${v}/${allResults.length} 回合）`));
    }

    // 最終玩家狀態
    console.log('\n🧍 最終玩家狀態:');
    const p = state.player.stats;
    console.log(`  HP: ${p.hp}/${p.maxHp} | Qi: ${p.qi}/${p.maxQi} | 飢餓: ${p.hunger}/${p.maxHunger}`);
    console.log(`  EXP: ${p.exp} | 地點: ${state.world.location}`);
    if (state.player.unlockedTitles.length) console.log(`  稱號: ${state.player.unlockedTitles.join('、')}`);
    if (state.world.tags.length) console.log(`  環境標籤: [${state.world.tags.join(', ')}]`);

    console.log('\n💡 Prompt 改進建議:');
    if (issueCounts['narrative 太短'] > 0) console.log('  → narrative 普遍太短，考慮提高最低字數要求');
    if (issueCounts['出現禁用模糊詞'] > 0) console.log('  → AI 仍使用模糊詞，可在 userPrompt 中再次強調');
    if (issueCounts['只有'] > 0) console.log('  → 選項數量不足，考慮明確要求「必須恰好4個選項」');
    if (issueCounts['action 欄位過短'] > 0) console.log('  → action 欄位品質差，需在範例中展示更長的 action 描述');
    if (warnCounts['stateUpdate 包含零值'] > 0) console.log('  → stateUpdate 仍有零值，需更明確說明省略規則');
    if (warnCounts['narrative 可能缺乏具體事件'] > 0) console.log('  → narrative 事件感不足，考慮要求「每段必須包含一句NPC對話」');
    if (Object.keys(issueCounts).length === 0 && Object.keys(warnCounts).length === 0) {
        console.log('  → Prompt 表現良好！可以考慮測試更多回合或邊界情況。');
    }

    console.log('\n' + '═'.repeat(60) + '\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
