export type HeroRole = 'striker' | 'support' | 'harvester' | 'specialist';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemSlot = 'weapon' | 'armor' | 'charm';

export interface HeroSkill {
  id: string;
  namePt: string;
  nameEn: string;
  level: number;
  maxLevel: number;
  descriptionPt: string;
  descriptionEn: string;
  statBonus: string;
}

export interface Equipment {
  id: string;
  namePt: string;
  nameEn: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  upgradeLevel: number; // +0 to +15
  stars: number; // 0 to 5
  basePower: number;
  affixes: {
    stat: string;
    value: number;
    unit: string;
  }[];
}

export interface Hero {
  id: string;
  name: string;
  titlePt: string;
  titleEn: string;
  role: HeroRole;
  level: number;
  experience: number;
  maxExperience: number;
  baseDamage: number;
  bombRadius: number;
  plantCooldown: number; // in seconds
  moveSpeed: number;
  critChance: number;
  element: 'physical' | 'fire' | 'frost' | 'void';
  equipped: {
    weapon: Equipment | null;
    armor: Equipment | null;
    charm: Equipment | null;
  };
  skills: HeroSkill[];
  // Animation / simulation state
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  lastPlantTime: number;
  state: 'walking' | 'planting' | 'cheering';
}

export type SquadId = 'alpha' | 'beta' | 'gamma';

export interface Squad {
  id: SquadId;
  namePt: string;
  nameEn: string;
  heroIds: string[];
  color: string;
}

export type MineralType = 'coal' | 'copper' | 'iron' | 'gold' | 'amethyst' | 'voidStone' | 'bossCore';

export interface MineRock {
  id: string;
  gridX: number;
  gridY: number;
  type: MineralType;
  maxHp: number;
  currentHp: number;
  dropValue: number;
  color: string;
  crackLevel: number; // 0 to 3
  isBoss?: boolean;
}

export interface ActiveBomb {
  id: string;
  x: number;
  y: number;
  fuseTimer: number; // remaining seconds
  maxFuse: number;
  radius: number; // tile blast range
  damage: number;
  crit: boolean;
  element: 'physical' | 'fire' | 'frost' | 'void';
  isMega?: boolean;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
  type: 'spark' | 'smoke' | 'oreShrapnel' | 'lootGem';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit?: boolean;
}

export interface PassiveNode {
  id: string;
  namePt: string;
  nameEn: string;
  descriptionPt: string;
  descriptionEn: string;
  cluster: 'blast' | 'greed' | 'haste' | 'elemental';
  x: number;
  y: number;
  cost: number;
  allocated: boolean;
  requires: string[];
  bonusType: 'blastDamage' | 'blastRadius' | 'oreYield' | 'squadSpeed' | 'critChance' | 'megaCooldown' | 'rareLootChance';
  bonusValue: number;
}

export interface MarketItem {
  id: string;
  namePt: string;
  nameEn: string;
  rarity: ItemRarity;
  category: 'mineral' | 'equipment' | 'charm' | 'blueprint';
  currentPrice: number;
  priceHistory: number[]; // 10 points
  trend: 'up' | 'down' | 'stable';
  userOwned: number;
  volume24h: number;
  descriptionPt: string;
  descriptionEn: string;
}

export interface GameWorld {
  id: number;
  namePt: string;
  nameEn: string;
  minStage: number;
  maxStage: number;
  themeColor: string;
  bgHex: string;
  groundHex: string;
  wallHex: string;
  oreTypes: MineralType[];
  descriptionPt: string;
  descriptionEn: string;
}
