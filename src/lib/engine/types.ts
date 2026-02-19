export type Attribute = 'strength' | 'agility' | 'constitution' | 'intelligence' | 'spirit' | 'luck' | 'charm';

export interface PlayerStats {
    level: number;
    exp: number;
    hp: number;
    maxHp: number;
    qi: number;
    maxQi: number;
    hunger: number;
    maxHunger: number;
    moral: 'Lawful' | 'Neutral' | 'Chaotic' | 'Good' | 'Evil'; // 道德傾向
    money: number;
    attributes: {
        strength: number; // 膂力
        agility: number; // 身法
        constitution: number; // 根骨
        intelligence: number; // 悟性
        spirit: number; // 定力/神識
        luck: number; // 福緣
        charm: number; // 魅力
    };
    reputation: {
        chivalry: number; // 俠義
        infamy: number; // 惡名
        fame: number; // 威名
        seclusion: number; // 隱逸
    };
    origin: string; // 出身
    originDefined: boolean; // 出身定型狀態
}

export interface MartialArt {
    name: string;
    level: string; // e.g., "初窺門徑"
    rank: string; // e.g., "基礎", "絕世"
    power: number; // e.g., 0.6 (This can be composite or just rank power) - let's keep it as is, or we might compute it dynamically. For simplicity, we can let power be the current calculated power.
    type: 'external' | 'internal' | 'light';
}

export interface Meridians {
    ren: boolean; // 任脈
    du: boolean; // 督脈
    chong: boolean; // 衝脈
    dai: boolean; // 帶脈
    yinqiao: boolean; // 陰蹺脈
    yangqiao: boolean; // 陽蹺脈
    yinwei: boolean; // 陰維脈
    yangwei: boolean; // 陽維脈
    central: boolean; // 中脈
}

export interface SpecialSkills {
    medicine: number; // 醫術
    poison: number; // 毒術
    stealth: number; // 潛行
    insight: number; // 洞察
}

export interface Item {
    id: string;
    name: string;
    description: string;
    type: 'weapon' | 'armor' | 'consumable' | 'material' | 'book';
    count: number;
    effect?: string;
}

export interface NarrativeLog {
    id: string;
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Option {
    id: string;
    label: string;
    action: string;
}

export interface GameState {
    player: {
        name: string;
        title: string;
        unlockedTitles: string[];
        gender: 'male' | 'female';
        stats: PlayerStats;
        skills: {
            basics: MartialArt[];   // 外功
            internal: MartialArt[]; // 內功
            light: MartialArt[];    // 輕功
        };
        meridians: Meridians;
        injuries: string[]; // 傷勢狀態
        specialSkills: SpecialSkills;
        relations: {
            master: string;
            sect: string;
            sectAffinity: Record<string, number>; // 門派關係
        };
        inventory: Item[];
        equipment: {
            weapon: string | null;
            armor: string | null;
            accessory: string | null;
        };
        booksRead: string[]; // 典籍掌握
        statusEffects: string[];
        companions: string[];
    };
    world: {
        location: string;
        unlockedLocations: string[];
        time: {
            year: number;
            month: number;
            day: number;
            period: string; // e.g., "酉時"
        };
        weather: string;
        weatherEffect: string; // e.g., "暗殺/偷竊成功率+20%，觀察弱點-30%"
        tags: string[];
    };
    system: {
        difficulty: string;
        deathPenalty: boolean;
    };
    narrative: NarrativeLog[];
    summary: string; // Rolling summary of past events
    worldState: {
        mainQuest: string;              // 當前主線目標
        questHistory: string[];         // 已完成的主線列表
        questStageSummaries: string[];  // 每個已完成階段的摘要（與 questHistory 對齊）
        questArc: string[];             // AI 編劇預生成的主線弧（10章一批）
        questArcIndex: number;          // 目前在 questArc 中的位置
        questStartTurn: number;         // 當前主線開始時的 assistant turn 數（用於精確計算進度）
        plotProgress: number;           // 劇情進度 (0-100)
        pacingCounter: number;          // 節奏計數
        currentCombatTurns: number;     // 當前戰鬥已持續回合
    };
    options: Option[];
    isGameStarted: boolean;
    isCharacterPanelOpen: boolean;
    isGameMenuOpen: boolean;
    notifications: any[];
    isProcessing: boolean;
    usage: {
        totalCost: number;
        totalInputTokens: number;
        totalOutputTokens: number;
    };
}
