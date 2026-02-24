#!/usr/bin/env node
/**
 * 自由江湖 - 完整 Token 費用測試
 * 模型：grok-4-1-fast-non-reasoning ($0.20/1M input, $0.50/1M output)
 *
 * 覆蓋所有 API 呼叫場景：
 *   初始化：江湖背景 → 角色背景 → Quest Arc → 開篇場景
 *   每回合：buildSystemPrompt（含歷史、含 summary 累積）
 *   每 6 回合：generateStageSummary
 *   每 ~70 回合：generateQuestArc 重新生成
 *
 * 使用方式：
 *   XAI_API_KEY=xai-xxx node scripts/test-token-cost.mjs
 */

const MODEL = 'grok-4-1-fast-non-reasoning';
const INPUT_PRICE_PER_M  = 0.20;
const OUTPUT_PRICE_PER_M = 0.50;

const API_KEY = process.env.XAI_API_KEY || process.env.AI_API_KEY || '';
if (!API_KEY) {
    console.error('\n❌ 請設定 XAI_API_KEY 環境變數');
    console.error('   用法：XAI_API_KEY=xai-xxx node scripts/test-token-cost.mjs\n');
    process.exit(1);
}

// ── 工具 ─────────────────────────────────────────────────

const fmt  = n => n.toLocaleString('en-US');
const usd  = n => `$${n.toFixed(6)}`;
const cost = (i, o) => ({
    i: (i / 1e6) * INPUT_PRICE_PER_M,
    o: (o / 1e6) * OUTPUT_PRICE_PER_M,
    get total() { return this.i + this.o; },
});

async function callGrok(systemPrompt, userPrompt = '請繼續') {
    const t0 = Date.now();
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user',   content: userPrompt },
            ],
            response_format: { type: 'json_object' },
        }),
    });
    if (!res.ok) throw new Error(`Grok API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return {
        text:  data.choices?.[0]?.message?.content || '',
        in:    data.usage?.prompt_tokens     || 0,
        out:   data.usage?.completion_tokens || 0,
        ms:    Date.now() - t0,
    };
}

const results = [];
function record(label, r) {
    const c = cost(r.in, r.out);
    results.push({ label, in: r.in, out: r.out, cost: c.total, ms: r.ms });
    console.log(`\n${'═'.repeat(64)}`);
    console.log(` 📋 ${label}`);
    console.log(`${'─'.repeat(64)}`);
    console.log(`  輸入 ${fmt(r.in).padStart(6)} tok  費用 ${usd(c.i)}   輸出 ${fmt(r.out).padStart(5)} tok  費用 ${usd(c.o)}`);
    console.log(`  單次合計 ${usd(c.total)}   回應時間 ${r.ms} ms`);
    console.log(`  預覽：${r.text.replace(/\s+/g,' ').substring(0,90)}…`);
    return c.total;
}

// ══════════════════════════════════════════════════════════
// Prompt 建構（完整複製 ActionPanel.tsx / gemini.ts 邏輯）
// ══════════════════════════════════════════════════════════

const WORLD_SEED = '武典現世——傳說中的曠世秘笈重現人間，各方勢力明爭暗鬥，刀光劍影遍布江湖';

const P_WORLD = `你是武俠世界的創世說書人，為《自由江湖》勾勒一個廣闊且生動的半架空江湖。
這是一個歷代武俠小說大師筆下（如金庸、古龍等）的傳奇都曾發生過的世界，而我們的故事，發生在那些叱吒風雲的英雄落幕多年之後。
請用武俠小說特有的筆觸——白話文、富含肌理感與恩怨情仇，讓人一讀便能感受到刀光劍影與快意恩仇。

這個世界的底色是：「${WORLD_SEED}」

【勢力與格局】
請將以下勢力融入這個世界，賦予他們在「後傳奇時代」的全新處境與相互交織的恩怨：
少林、武當、點蒼山、血蓮教、朝廷、華山、藥王殿、唐門、日月神教、逍遙派。

【生成要求】
以第三人稱旁白，一氣呵成地寫出這個江湖的當下局勢（200-300字）。
重點描繪當下江湖的「氣息」與「核心矛盾」——是風雨欲來的壓抑？還是群雄並起的混亂？
讓讀者讀完立刻就有踏入這片江湖、攪動風雲的衝動。

只回傳 JSON：
{
  "worldNarrative": "200-300字江湖背景（給玩家看的敘述，聚焦於當前的江湖局勢與氛圍）",
  "factions": [{"name":"","alignment":"正道|邪道|中立|朝廷","philosophy":"","martialStyle":"","personality":"","status":"如：閉門封山/暗中擴張/權傾朝野/內鬥不斷"}],
  "centralConflict": "用一句話總結當前江湖最大的矛盾或即將爆發的危機"
}`;

function P_BACKSTORY(worldNarrative, factionNames) {
    return `你是《自由江湖》的專屬說書人，現在請你根據剛剛勾勒的江湖局勢，為我們的主角譜寫一段引人入勝的身世背景。
請延續武俠小說的獨特筆觸——第三人稱旁白，白話文中帶點文言的凝練，寫出人物的立體感與宿命感。

【當前江湖局勢】
${worldNarrative}

【主角基本資料】
・姓名：李玄鶴（男）

【生成要求】
請用200-300字，一氣呵成地講述主角的來歷。
內容需自然融入以下元素，但不必生硬羅列：
1. 出身來歷與師承（必須是上方世界觀中存在的勢力之一，或是無門無派的「江湖散人」）。
2. 一段刻骨銘心的過往或遭遇。
3. 驅使主角踏入這渾水江湖的「核心執念」（如：復仇、尋人、追求武道巔峰、或身不由己的捲入）。
4. 主角與當前江湖主要矛盾的某種微妙聯繫。

可選門派（來自當前江湖）：${factionNames}、江湖散人

只回傳 JSON：
{
  "backstory": "200-300字主角背景故事（給玩家看的敘述，要有強烈的帶入感與武俠氛圍）",
  "relations": {"sect": "所屬門派", "master": "師父名號（無則填「無」）"},
  "stateUpdate": {
    "newItems": [{"id":"","name":"","description":"","type":"weapon|armor|consumable|material|book","count":1}],
    "newSkills": [{"name":"","type":"external|internal|light","rank":"基礎|進階|上乘|絕學","level":"初窺門徑"}],
    "initialEquipment": {"weapon":"武器名（無則省略）","armor":"護甲名（無則省略）"}
  }
}
注意：newItems/newSkills/initialEquipment 僅限背景故事中明確提到的事物，若無則省略該欄位或回傳空陣列。`;
}

function P_QUEST_ARC(worldNarrative, backstory, usedStr = null) {
    return `你是武俠小說的主編，正在為《自由江湖》規劃一段冒險弧線（10個章節目標）。

江湖世界觀：
${worldNarrative}
玩家資訊：
・姓名：李玄鶴（江湖遊俠）
・當前地點：白鹿鎮
・武學：化骨綿掌
・主角前情：${backstory.substring(0, 200)}
${usedStr ? `・以下目標已出現，嚴禁重複或相似：【${usedStr}】` : ''}

【核心規則】每個章節是「玩家需要完成的任務目標」，不是「必定發生的事件描述」。
目標告訴玩家「要去哪、做什麼、找誰」，至於過程中遇到什麼由敘事AI自由發揮。

【武俠世界多元面向——10章中各類型至少出現一次】
・江湖情義：結義、報恩、化解仇怨、義氣相助
・秘聞探查：打探情報、追查真相、揭露陰謀、尋訪知情人
・修煉成長：尋找秘笈、拜師學藝、突破瓶頸、打通經脈
・人際周旋：與門派周旋、結交豪傑、獲取信任、化敵為友
・生死危機：逃脫追殺、絕地求生、捨身護人（戰鬥是手段，不是目標本身）
・江湖遊歷：名勝尋訪、奇遇探索、參加武林大會、路見不平

格式要求：
・每章15-20字，格式：「去哪裡 / 對誰 + 做什麼目的」
・✓ 正確：「潛入藏書閣查閱失蹤師兄的線索」「說服幫主相信官府栽贓之事」
・✗ 錯誤：「與黑衣人大戰三百回合」「繼續探索」「前往某地」
・10章節奏：2情義/探查 → 1修煉 → 2人際/遊歷 → 2危機 → 1修煉 → 2情義/終結
・章節間有邏輯因果，前章結果導致後章任務

只回傳 JSON：{"arc": ["目標1","目標2","目標3","目標4","目標5","目標6","目標7","目標8","目標9","目標10"]}`;
}

function P_OPENING(worldNarrative, backstory, firstQuest) {
    return `你是《自由江湖》的說書人，根據世界觀、主角背景與第一章目標，生成玩家進入遊戲的第一幕場景。

江湖世界觀摘要：${worldNarrative.substring(0, 100)}
主角背景：${backstory}
第一章目標：${firstQuest || '踏入江湖'}

【開篇場景要求（80-150字）】
・第二人稱「你」，強烈帶入感
・呈現具體的當下場景：地點、時辰、天氣、感官細節（聲音/氣味/光線）
・氛圍多元，不限打鬥——清晨趕路、市集偶遇、寺廟靜修、客棧等待皆可
・自然銜接第一章目標，結尾留下一個明確的行動起點
・禁止出現：「似乎」「好像」「彷彿」「可能」「隱約」

只回傳 JSON：
{
  "narrative": "80-150字開篇場景",
  "options": [{"action":"具體行動（10-20字）"},{"action":""},{"action":""},{"action":""}],
  "stateUpdate": {"location": "具體地點名稱","weather": "天氣","newTags": ["地點標籤","天氣標籤"]}
}`;
}

// buildSystemPrompt 模擬（完全對照 prompt.ts）
function buildSystemPrompt(worldBackground, summary, historyItems, turnCount = 1) {
    // history: historyItems 是 [{role, content}] 共最多 8 筆
    // assistant 的 content 截到 150 字
    const recentHistory = historyItems
        .slice(-8)
        .map(l => l.role === 'user'
            ? `【玩家】${l.content}`
            : `【敘事】${l.content.substring(0, 150)}`)
        .join('\n');

    // Director directives（模擬主線任務已進行 5 回合）
    const directives = `【主線任務】當前目標：「追查運書隊遭截殺的真相」
・敘事主體必須讓玩家在此目標上有明確進展或阻礙
・NPC/環境/突發事件都服務於此目標
・至少2個選項直接推進目標；禁止出現「暫時不管」類選項
${turnCount >= 5 ? `【章節衝刺】已進行 ${turnCount}/6 回合，本回合必須出現關鍵突破或明確結果。` : ''}`;

    return `你是《自由江湖》的說書人兼GM，劇情要有武俠的精彩與節奏。

━━ 導演指令（最高優先）━━
${directives}

━━ 江湖世界 ━━
${worldBackground}

━━ 主角前情 ━━
${summary}

━━ 近況 ━━
${recentHistory || '（暫無）'}

━━ 狀態 ━━
地點：白鹿鎮外山路｜申時｜晴（無）[山林,官道]
李玄鶴（江湖遊俠）Lv.3｜氣血85/100｜內力40/50｜飢餓65｜道德Neutral
膂力8 身法5 根骨8 悟性9 定力5 福緣5 魅力5
聲望：俠義12 惡名0 威名5
武學：化骨綿掌(初窺門徑)｜裝備：朴刀/無
物品：金創藥x2、乾糧x3

━━ 武學體系 ━━
品階：基礎(x1)・進階(x1.5)・上乘(x2)・絕世(x3)・神功(x5)｜境界：初窺門徑(x1.1)・略有小成(x1.3)・登堂入室(x1.5)・爐火純青(x2.0)・返璞歸真(x3.0)

━━ 主角命格（硬規則）━━
・HP 不得低於1；當前85，hpChange 下限 -84
・HP ≤ 30 時 hpChange 不得為負
・任何致命危機必有生路；敵人不能殺死主角

━━ 武學戰鬥體系 ━━
【外功——攻防招式】直接造成傷害：
・hpChange = -(膂力 + 品階加成) × 內功倍率 - 目標根骨÷5（防禦減免）
・品階加成：基礎+0 進階+10 上乘+25 絕世+60 神功+120
・參考值：膂力10→約-10；膂力30→約-30；膂力60→約-60；膂力100→約-100
【內功——輔助心法】不直接傷害，而是：
・倍增外功威力（初窺×1.1；爐火純青×2.0；返璞歸真×3.0）
・療傷回血（hpChange 正值）；恢復內力（qiChange 正值）
・特殊狀態（定身、護體、破防等）
【輕功——身法閃避】不直接傷害，而是：
・閃避敵攻（使傷害大幅降低或歸零）
・奇襲先手、快速脫身、追擊敵人
・身法越高，逃跑/追擊/閃避成功率越高
【屬性上限】所有屬性最高100；attributeChanges 普通事件+1~+3，重大突破+5~+10

━━ 敘事法則 ━━
・每回合一件具體事發生，80-150字，包含感官細節
・行動三合一：執行過程 → 立即結果 → 不可逆局面改變
・禁詞：似乎/好像/彷彿/可能/隱約/也許——直接描述發生了什麼
・場景自洽：已離場者不再互動；物理常識成立（斷臂不持劍）
・屬性影響：膂力→攻防 | 身法→閃避逃跑 | 根骨→防禦抗傷 | 悟性→識破學功 | 福緣→奇遇 | 魅力→NPC態度

━━ 選項法則 ━━
・4個選項覆蓋4個截然不同，讓玩家覺得選了哪個都可惜。
・每選項 action要說清楚做什麼/對誰/目的（大概10-20字）

━━ 輸出規則 ━━
只輸出 JSON，stateUpdate 只填真正有變化的欄位（0值不寫）。
物品：獲得→newItems；使用/失去→removedItems；同名自動疊加。
情報：得知可前往地點→第1選項為前往該地，或已移動則填 newLocation。
newTags/removedTags 僅限地形/環境/天氣標籤（如「山林」「薄霧」「廢墟」），嚴禁填入NPC名稱、門派或人際關係。
attributeChanges key（僅此7個）：strength/agility/constitution/intelligence/spirit/luck/charm
reputationChanges key（僅此3個）：chivalry/infamy/fame

{
  "narrative": "（80-150字，具體事件，感官細節）",
  "options": [
    { "action": "拔刀橫擋喝問蒙面人的身分來歷" },
    { "action": "壓低身形跟蹤蒙面人至接頭地點" },
    { "action": "走近掌柜低聲打聽此人來歷底細" },
    { "action": "倒地裝醉待其走近突然絆倒奪物" }
  ],
  "stateUpdate": {
    "hungerChange": -1,
    "hpChange": -15,
    "newItems": [{ "name": "物品名", "count": 1, "type": "consumable", "description": "簡短描述" }],
    "removedItems": [{ "name": "金創藥", "count": 1 }],
    "newSkills": [{ "name": "武功名", "type": "external|internal|light", "rank": "基礎", "level": "初窺門徑" }],
    "newTitles": ["江湖稱號"],
    "newTags": ["新增環境標籤"],
    "removedTags": ["移除環境標籤"],
    "newLocation": "新地點名稱",
    "weatherChange": "新天氣",
    "attributeChanges": { "luck": 1 },
    "reputationChanges": { "chivalry": 5 }
  }
}`;
}

function P_STAGE_SUMMARY(playerName, mainQuest, stageLogs) {
    return `你是武俠史書的筆錄者。請將以下「${playerName}」的冒險記錄，濃縮成2-3句話的階段摘要。

主線目標：${mainQuest}
近期事件：
${stageLogs}

要求：
・第三人稱，武俠筆法
・保留關鍵人物、地點、重要轉折
・50字以內，言簡意賅

只回傳 JSON：{"summary": "摘要內容"}`;
}

// ══════════════════════════════════════════════════════════
// 主程式
// ══════════════════════════════════════════════════════════
(async () => {
    console.log(`\n${'═'.repeat(64)}`);
    console.log(` 🗡  自由江湖 完整 Token 費用測試`);
    console.log(` 📦 模型：${MODEL}`);
    console.log(` 💰 定價：輸入 $${INPUT_PRICE_PER_M}/1M  輸出 $${OUTPUT_PRICE_PER_M}/1M`);
    console.log(`${'═'.repeat(64)}`);

    // ──────────────────────────────────────────────────────
    // 初始化流程（開一局新遊戲）
    // ──────────────────────────────────────────────────────
    console.log('\n\n【一】初始化流程（開一局新遊戲）');

    process.stdout.write('\n⏳ [1/4] 江湖背景...');
    let worldNarrative = '', factionNames = '', centralConflict = '';
    const r_world = await callGrok(P_WORLD, '生成江湖世界');
    process.stdout.write(' 完成\n');
    record('1. 江湖背景 (worldPrompt)', r_world);
    try {
        const p = JSON.parse(r_world.text);
        worldNarrative  = p.worldNarrative || '';
        factionNames    = (p.factions||[]).map(f=>f.name).join('、') || '江湖散人';
        centralConflict = p.centralConflict || '';
    } catch(e) { worldNarrative = r_world.text.substring(0, 300); }

    process.stdout.write('\n⏳ [2/4] 角色背景...');
    let backstory = '';
    const r_back = await callGrok(P_BACKSTORY(worldNarrative, factionNames), '生成主角背景');
    process.stdout.write(' 完成\n');
    record('2. 角色背景 (backstoryPrompt)', r_back);
    try { backstory = JSON.parse(r_back.text).backstory || ''; } catch(e) {}

    process.stdout.write('\n⏳ [3/4] Quest Arc（10章劇情弧）...');
    let arc = [];
    const r_arc = await callGrok(P_QUEST_ARC(worldNarrative, backstory), '生成劇情弧');
    process.stdout.write(' 完成\n');
    record('3. Quest Arc（10章，初始）', r_arc);
    try { arc = JSON.parse(r_arc.text).arc || []; } catch(e) {}

    process.stdout.write('\n⏳ [4/4] 開篇場景...');
    const r_open = await callGrok(P_OPENING(worldNarrative, backstory, arc[0] || '踏入江湖'), '生成開篇');
    process.stdout.write(' 完成\n');
    record('4. 開篇場景 (openingPrompt)', r_open);

    // ──────────────────────────────────────────────────────
    // 每回合（3 種情境）
    // ──────────────────────────────────────────────────────
    console.log('\n\n【二】每回合故事（3 種情境）');

    // 情境 A：早期（summary = backstory，歷史 4 輪）
    const earlyHistory = [
        { role: 'user',      content: '拔刀橫擋喝問蒙面人的身分來歷' },
        { role: 'assistant', content: '刀光乍現，你攔腰截住領頭黑衣人的坐騎。那人冷笑，從懷中摸出一枚令牌擲於地上——赤焰堂的標記，鑲金邊、刻火紋，江湖中令人聞風色變的惡名。' },
        { role: 'user',      content: '壓低身形跟蹤黑衣人至接頭地點' },
        { role: 'assistant', content: '你隱於屋檐，俯瞰赤焰堂的密會。堂主與一名官服中年人交換卷軸，低聲談及「三日後截殺運書隊」，話語間殺意凜然，令夜風都似乎凝固片刻。' },
    ];
    process.stdout.write('\n⏳ [A] 早期回合（歷史4筆，summary=backstory）...');
    const r_turnA = await callGrok(
        buildSystemPrompt(worldNarrative, backstory, earlyHistory, 2),
        '玩家行動：『走近掌柜低聲打聽此人來歷底細』\n\n結合屬性與環境，給出完整因果鏈。禁止模糊詞，直接描述。'
    );
    process.stdout.write(' 完成\n');
    record('5A. 每回合-早期（歷史4筆）', r_turnA);

    // 情境 B：中期（summary 累積 2 段摘要，歷史 8 筆）
    const accumulatedSummary = backstory + '\n\n' +
        '玄鶴追查赤焰堂截殺運書隊一事，在白鹿鎮外山路設伏，成功截獲密函，得知幕後主謀藏身鐵壁城。' + '\n\n' +
        '玄鶴潛入鐵壁城，與堂主正面交鋒，以化骨綿掌擊傷對方，但密函已被轉移，線索指向兵部侍郎陸廷。';
    const midHistory = [
        { role: 'user',      content: '向酒樓說書人打聽陸廷的行蹤下落' },
        { role: 'assistant', content: '說書人壓低嗓音，道出陸廷三日後將過境松鶴道，押送一批「御用書籍」南下。話語間眼神閃爍，顯然所知不止於此。' },
        { role: 'user',      content: '以重金買通說書人請其詳述所知細節' },
        { role: 'assistant', content: '碎銀入袖，說書人吐出關鍵：那批書籍中藏有《蒼穹真訣》的第三卷殘頁，護衛人數超過三十，且有赤焰堂高手隨行。' },
        { role: 'user',      content: '快馬加鞭趕赴松鶴道提前埋伏守候' },
        { role: 'assistant', content: '松鶴道兩側松柏蒼翠，你隱身巨石之後。辰時剛過，車隊果然現身，旗幟上繡著兵部徽記，押後跟著兩名身形凶悍的黑衣人。' },
        { role: 'user',      content: '待車隊過半時突然出擊截停馬車' },
        { role: 'assistant', content: '你縱身而下，掌風激起漫天塵土。領頭護衛長刀出鞘，三招之內，你以化骨綿掌卸去他的臂力，長刀落地，其餘人頓時慌亂。' },
    ];
    process.stdout.write('\n⏳ [B] 中期回合（歷史8筆，summary累積2段）...');
    const r_turnB = await callGrok(
        buildSystemPrompt(worldNarrative, accumulatedSummary, midHistory, 5),
        '玩家行動：『翻開馬車搜查那批所謂御用書籍』\n\n結合屬性與環境，給出完整因果鏈。禁止模糊詞，直接描述。'
    );
    process.stdout.write(' 完成\n');
    record('5B. 每回合-中期（歷史8筆，summary×3段）', r_turnB);

    // 情境 C：後期（summary 累積 5 段摘要，歷史 8 筆）
    const lateSummary = backstory + '\n\n' +
        '玄鶴追查赤焰堂截殺運書隊，在白鹿鎮設伏截獲密函。\n\n' +
        '潛入鐵壁城，以化骨綿掌傷退堂主，得知密函已轉交兵部。\n\n' +
        '松鶴道截停車隊，奪回《蒼穹真訣》第三卷殘頁，陸廷侍郎身份暴露。\n\n' +
        '被朝廷追緝，玄鶴輾轉逃至西境，於藏書閣中得遇神秘老者，習得「破雲指」外功。\n\n' +
        '與舊友重逢，得知《蒼穹真訣》共九卷，其餘殘頁散落各方勢力手中，武林盟主之爭一觸即發。';
    process.stdout.write('\n⏳ [C] 後期回合（歷史8筆，summary累積5段）...');
    const r_turnC = await callGrok(
        buildSystemPrompt(worldNarrative, lateSummary, midHistory, 5),
        '玩家行動：『提議聯合正道各派共同對抗赤焰堂』\n\n結合屬性與環境，給出完整因果鏈。禁止模糊詞，直接描述。'
    );
    process.stdout.write(' 完成\n');
    record('5C. 每回合-後期（歷史8筆，summary×5段）', r_turnC);

    // ──────────────────────────────────────────────────────
    // 週期性呼叫
    // ──────────────────────────────────────────────────────
    console.log('\n\n【三】週期性呼叫');

    // 每 6 回合：generateStageSummary
    const stageLogs = [
        '玄鶴在白鹿鎮外山路埋伏，成功截停赤焰堂的運書隊。',
        '從密函中得知幕後主謀是兵部侍郎陸廷，且書中藏有武典殘頁。',
        '快馬追至松鶴道，以化骨綿掌擊退護衛，奪回第三卷殘頁。',
        '陸廷侍郎倉皇逃跑，赤焰堂高手圍至，玄鶴且戰且退，趁夜遁走。',
        '翻越青嶺山，傷勢在山間小廟中由老尼包紮，得知西境藏書閣藏有功法。',
        '抵達藏書閣，與守閣老者對話，展示殘頁，老者決定傳授「破雲指」。',
    ].join('\n');
    process.stdout.write('\n⏳ [P1] 每6回合：階段摘要 (generateStageSummary)...');
    const r_stage = await callGrok(
        P_STAGE_SUMMARY('李玄鶴', '追查運書隊遭截殺的真相', stageLogs),
        '生成階段摘要'
    );
    process.stdout.write(' 完成\n');
    record('P1. 階段摘要（每6回合）', r_stage);

    // Quest Arc 重新生成（usedStr 含已用目標）
    const usedStr = '追查運書隊遭截殺的真相、潛入鐵壁城搜查赤焰堂密檔、攔截陸廷侍郎揭露兵部陰謀、逃脫朝廷緝拿尋找藏身之處、於西境藏書閣習得破雲指外功';
    process.stdout.write('\n⏳ [P2] 每~70回合：Quest Arc 重新生成（含 usedStr）...');
    const r_arc2 = await callGrok(P_QUEST_ARC(worldNarrative, lateSummary, usedStr), '重新生成劇情弧');
    process.stdout.write(' 完成\n');
    record('P2. Quest Arc 重新生成（每~70回合）', r_arc2);

    // ══════════════════════════════════════════════════════
    // 費用匯總
    // ══════════════════════════════════════════════════════
    console.log(`\n\n${'═'.repeat(64)}`);
    console.log(' 📊 完整費用匯總');
    console.log(`${'─'.repeat(64)}`);
    results.forEach(r => {
        const c = cost(r.in, r.out);
        console.log(` ${r.label.substring(0,34).padEnd(35)} in:${fmt(r.in).padStart(6)} out:${fmt(r.out).padStart(5)}  ${usd(r.cost)}`);
    });

    // 開局成本
    const initLabels = ['1. 江湖背景', '2. 角色背景', '3. Quest Arc', '4. 開篇場景'];
    const initResults = results.filter(r => initLabels.some(l => r.label.startsWith(l)));
    const initCost = initResults.reduce((s,r) => s + r.cost, 0);
    const initIn   = initResults.reduce((s,r) => s + r.in, 0);
    const initOut  = initResults.reduce((s,r) => s + r.out, 0);

    // 平均每回合（含週期性呼叫攤銷）
    const turnA  = results.find(r => r.label.includes('5A'));
    const turnB  = results.find(r => r.label.includes('5B'));
    const turnC  = results.find(r => r.label.includes('5C'));
    const stageR = results.find(r => r.label.includes('P1'));
    const arcR   = results.find(r => r.label.includes('P2'));

    // 攤銷：stageSummary 每 6 回合 ÷ 6；arc 重生 每 70 回合 ÷ 70
    const stageAmort = stageR.cost / 6;
    const arcAmort   = arcR.cost   / 70;

    const avgTurnEarly  = turnA.cost + stageAmort + arcAmort;
    const avgTurnMid    = turnB.cost + stageAmort + arcAmort;
    const avgTurnLate   = turnC.cost + stageAmort + arcAmort;

    console.log(`${'─'.repeat(64)}`);
    console.log(` 開局合計（4步）                   in:${fmt(initIn).padStart(6)} out:${fmt(initOut).padStart(5)}  ${usd(initCost)}`);
    console.log(`\n 平均每回合費用（含週期性攤銷）：`);
    console.log(`   早期（≤12回合） ${usd(avgTurnEarly)}  /回合`);
    console.log(`   中期（≤40回合） ${usd(avgTurnMid)}  /回合`);
    console.log(`   後期（40+回合） ${usd(avgTurnLate)}  /回合`);

    // 假設玩家 30 回合/session，summary 成長至中期
    const session30 = initCost + 30 * avgTurnMid;
    console.log(`\n 典型一局（開局 + 30 回合）：${usd(session30)}`);
    console.log(`   每 $1 可玩局數（30回合/局）：${Math.floor(1 / session30).toLocaleString()} 局`);

    // 靈石定價
    console.log(`\n 🪨 靈石定價建議（1靈石 = 1回合，中期成本）：`);
    const costPerStone = avgTurnMid;
    const packs = [
        { name: '試煉   30石', stones: 30,   twdPrice: 30  },
        { name: '冒險  100石', stones: 100,  twdPrice: 69  },
        { name: '江湖  500石', stones: 500,  twdPrice: 249 },
        { name: '宗師 2000石', stones: 2000, twdPrice: 799 },
    ];
    const USD_TO_TWD = 32;
    packs.forEach(p => {
        const rawCost    = p.stones * costPerStone;
        const rawCostTwd = rawCost * USD_TO_TWD;
        const margin     = p.twdPrice / rawCostTwd;
        console.log(`   ${p.name}：NT$${p.twdPrice}  成本 NT$${rawCostTwd.toFixed(2)}  毛利 ${margin.toFixed(0)}x`);
    });

    // 加上開局成本攤進每局
    console.log(`\n   * 開局成本 ${usd(initCost)} 已含在首局消耗中，後續局次無需再算`);
    console.log(`${'═'.repeat(64)}\n`);
})();
