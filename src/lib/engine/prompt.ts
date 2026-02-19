import { GameState } from './types';
import { MARTIAL_ART_LEVELS, MARTIAL_ART_RANKS } from './constants';

const MAX_HISTORY_TURNS = 8;

function getDirectorDirectives(state: GameState): string {
  const { worldState, player } = state;
  if (!worldState) return '';
  const directives: string[] = [];

  if (worldState.mainQuest) {
    const arc = worldState.questArc ?? [];
    const arcIndex = worldState.questArcIndex ?? 0;
    const nextChapter = arc[arcIndex + 1] ?? null;
    const lines = [
      `【主線任務】當前目標：「${worldState.mainQuest}」`,
      `・敘事主體必須讓玩家在此目標上有明確進展或阻礙`,
      `・NPC/環境/突發事件都服務於此目標`,
      `・至少2個選項直接推進目標；禁止出現「暫時不管」類選項`,
    ];
    if (nextChapter) {
      lines.push(`・下一目標「${nextChapter}」——本回合埋下過渡契機`);
    }
    directives.push(lines.join('\n'));
  }

  if (worldState.currentCombatTurns >= 4) {
    directives.push(`【戰鬥強制結算】已持續 ${worldState.currentCombatTurns} 回合，本回合必須終結：寫出明確勝負，選項切換至戰後情境，禁止繼續攻防描寫。`);
  } else if (worldState.currentCombatTurns >= 2) {
    directives.push(`【戰鬥第 ${worldState.currentCombatTurns} 回合】必須出現明顯轉折，為結算鋪墊。選項策略維度必須與上回合不同。`);
  }

  if (worldState.currentCombatTurns === 0 && worldState.pacingCounter >= 5) {
    directives.push(`【情境推進】已平靜 ${worldState.pacingCounter} 回合，請推動劇情發展（如：揭示新線索、場景變換、或遭遇新角色），不一定要發生戰鬥，重點是讓故事向前流動。`);
  }

  const hpRatio = player.stats.hp / player.stats.maxHp;
  if (hpRatio <= 0.3 && hpRatio > 0) {
    directives.push(`【瀕危警報】HP ${player.stats.hp}/${player.stats.maxHp}，本回合必須出現救場轉機，hpChange 不得為負。`);
  }

  const QUEST_TURNS = 6;
  const assistantCount = state.narrative.filter(l => l.role === 'assistant').length;
  const turnsIntoQuest = Math.max(0, assistantCount - (worldState.questStartTurn ?? 0));
  if (turnsIntoQuest >= QUEST_TURNS - 1 && worldState.mainQuest) {
    directives.push(`【章節衝刺】「${worldState.mainQuest}」已進行 ${turnsIntoQuest}/${QUEST_TURNS} 回合，本回合必須出現關鍵突破或明確結果。`);
  }

  return directives.join('\n\n');
}

export function buildSystemPrompt(state: GameState): string {
  const { player, world, narrative, summary } = state;
  const directorDirectives = getDirectorDirectives(state);

  const levelsStr = MARTIAL_ART_LEVELS.map(l => `${l.name}(x${l.power})`).join('・');
  const ranksStr = MARTIAL_ART_RANKS.map(r => `${r.name}(x${r.power})`).join('・');

  const recentHistory = narrative
    .filter(log => log.role !== 'system')
    .slice(-MAX_HISTORY_TURNS)
    .map(log => log.role === 'user'
      ? `【玩家】${log.content}`
      : `【敘事】${log.content.substring(0, 150)}`)
    .join('\n');

  const skillStr = [...player.skills.basics, ...player.skills.internal, ...(player.skills.light ?? [])]
    .map((s: any) => `${s.name}(${s.level})`).join('、') || '無';

  return `你是《自由江湖》的說書人兼GM，劇情要有金庸武俠的精彩與節奏。
${directorDirectives ? `\n━━ 導演指令（最高優先）━━\n${directorDirectives}\n` : ''}
━━ 前情 ━━
${summary || '（遊戲剛開始）'}

━━ 近況 ━━
${recentHistory || '（暫無）'}

━━ 狀態 ━━
地點：${world.location}｜${world.time.period}｜${world.weather}（${world.weatherEffect}）[${world.tags.join(',')}]
${player.name}（${player.title}）Lv.${player.stats.level}｜氣血${player.stats.hp}/${player.stats.maxHp}｜內力${player.stats.qi}/${player.stats.maxQi}｜飢餓${player.stats.hunger}｜道德${player.stats.moral}
膂力${player.stats.attributes.strength} 身法${player.stats.attributes.agility} 根骨${player.stats.attributes.constitution} 悟性${player.stats.attributes.intelligence} 定力${player.stats.attributes.spirit} 福緣${player.stats.attributes.luck} 魅力${player.stats.attributes.charm}
聲望：俠義${player.stats.reputation.chivalry} 惡名${player.stats.reputation.infamy} 威名${player.stats.reputation.fame} 隱逸${player.stats.reputation.seclusion}
武學：${skillStr}｜裝備：${player.equipment.weapon || '無'}/${player.equipment.armor || '無'}
物品：${player.inventory.map((i: any) => `${i.name}x${i.count}`).join('、') || '無'}${player.statusEffects.length ? `｜異常：${player.statusEffects.join('、')}` : ''}

━━ 武學體系 ━━
品階：${ranksStr}｜境界：${levelsStr}

━━ 主角命格（硬規則）━━
・HP 不得低於1；當前${player.stats.hp}，hpChange 下限 ${-(player.stats.hp - 1)}
・HP ≤ ${Math.ceil(player.stats.maxHp * 0.3)} 時 hpChange 不得為負
・任何致命危機必有生路；敵人不能殺死主角

━━ 敘事法則 ━━
・每回合一件具體事發生，120-150字，包含感官細節
・行動三合一：執行過程 → 立即結果 → 不可逆局面改變
・禁詞：似乎/好像/彷彿/可能/隱約/也許——直接描述發生了什麼
・場景自洽：已離場者不再互動；物理常識成立（斷臂不持劍）
・屬性影響：膂力→攻防 | 身法→閃避逃跑 | 根骨→防禦抗傷 | 悟性→識破學功 | 福緣→奇遇 | 魅力→NPC態度

━━ 選項法則 ━━
・4個選項覆蓋4個截然不同，讓玩家覺得選了哪個都可惜。
・每選項 action 欄位 10-20字，說清楚做什麼/對誰/目的

━━ 輸出規則 ━━
只輸出 JSON，stateUpdate 只填真正有變化的欄位（0值不寫）。
物品：獲得→newItems；使用/失去→removedItems；同名自動疊加。
情報：得知可前往地點→第1選項為前往該地，或已移動則填 newLocation。
attributeChanges key（僅此7個）：strength/agility/constitution/intelligence/spirit/luck/charm
reputationChanges key（僅此4個）：chivalry/infamy/fame/seclusion

{
  "narrative": "（120-200字，具體事件，感官細節）",
  "options": [
    { "action": "拔刀橫擋喝問蒙面人的身分來歷" },
    { "action": "壓低身形跟蹤蒙面人至接頭地點" },
    { "action": "走近掌柜低聲打聽此人來歷底細" },
    { "action": "倒地裝醉待其走近突然絆倒奪物" }
  ],
  "stateUpdate": {
    "hungerChange": -1,
    "hpChange": -15,
    "expChange": 10,
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
}`.trim();
}

export function buildUserPrompt(action: string): string {
  const combatKeywords = ['攻', '斬', '打', '殺', '刀', '劍', '拳', '踢', '躲', '擋', '逃', '衝', '刺', '砍', '格', '推', '摔', '踹'];
  const isCombat = combatKeywords.some(k => action.includes(k));

  return `玩家行動：『${action}』

結合屬性與環境，給出完整因果鏈：執行過程 → 立即結果（確定反應，非中途狀態）→ 局面改變（至少一項不可逆）。${isCombat ? '\n戰鬥須給出明確物理結果：傷害數值、位置變化、是否終結。' : ''}
禁止模糊詞，直接描述。`.trim();
}
