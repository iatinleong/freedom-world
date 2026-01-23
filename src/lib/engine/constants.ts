export const MARTIAL_ART_LEVELS = [
    { name: '初窺門徑', power: 1.0, desc: '入門水準，動作生硬，僅得皮毛。' },
    { name: '略有小成', power: 1.2, desc: '動作熟練，能應用於實戰。' },
    { name: '駕輕就熟', power: 1.5, desc: '招式連貫，開始發揮武學特性。' },
    { name: '融會貫通', power: 2.0, desc: '領悟心法，內外合一，威力大增。' },
    { name: '爐火純青', power: 3.0, desc: '招隨意發，毫無滯礙，高手之列。' },
    { name: '出神入化', power: 5.0, desc: '登峰造極，能自創變招，宗師風範。' },
    { name: '返璞歸真', power: 10.0, desc: '無招勝有招，舉手投足皆是武道。' },
    { name: '震古爍今', power: 20.0, desc: '傳說境界，僅存在於神話中。' }
] as const;

export const MARTIAL_ART_RANKS = [
    { name: '基礎', power: 1.0, desc: '市井流傳的入門功夫' },
    { name: '進階', power: 1.5, desc: '門派弟子的必修武技' },
    { name: '上乘', power: 2.0, desc: '江湖高手的成名絕技' },
    { name: '絕世', power: 3.0, desc: '震驚江湖的稀世絕學' },
    { name: '神功', power: 5.0, desc: '傳說中的無上神功' }
] as const;

export type MartialArtLevelName = typeof MARTIAL_ART_LEVELS[number]['name'];
export type MartialArtRankName = typeof MARTIAL_ART_RANKS[number]['name'];

export function getMartialArtPower(levelName: string): number {
    const level = MARTIAL_ART_LEVELS.find(l => l.name === levelName);
    return level ? level.power : 1.0;
}

export function getMartialArtRankPower(rankName: string): number {
    const rank = MARTIAL_ART_RANKS.find(r => r.name === rankName);
    return rank ? rank.power : 1.0;
}
