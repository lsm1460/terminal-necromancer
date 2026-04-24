import { AttackType } from './core'

export const HOSTILITY_LIMIT = 50

export const MAP_IDS = {
  B1_SUBWAY: 'B1_Subway_Entrance',
  B2_TRANSIT: 'B2_Transit_Area',
  B3_STEEL_DOCK: 'B3_Steel_Loading_Dock',
  B3_5_RESISTANCE_BASE: 'B3_5_Resistance_Base',
  B4_Waste_Disposal_Area: 'B4_Waste_Disposal_Area',
  B5_VIP_lounge: 'B5_VIP_lounge',
  B6_VEHICLE_DEPOT: 'B6_VEHICLE_DEPOT',
} as const

export const FULL_VISIBLE_MAP_ID_LIST = [MAP_IDS.B1_SUBWAY, MAP_IDS.B3_5_RESISTANCE_BASE]

export type MapId = (typeof MAP_IDS)[keyof typeof MAP_IDS]

export type SkeletonRarity = 'common' | 'rare' | 'elite' | 'epic' | 'legendary'

type SubClass = {
  id: string
  name: string
  statMod: { atk: number; def: number; hp: number; agi: number }
  skills: string[]
  weight: number
  orderWeight: number
  attackType: AttackType
}

export const RARITY_DATA: Record<SkeletonRarity, { bonus: number; weight: number; subClasses: SubClass[] }> = {
  common: {
    bonus: 1.1,
    weight: 500,
    subClasses: [
      {
        id: 'skeleton',
        name: '병사',
        orderWeight: 10,
        statMod: { atk: 1, def: 1, hp: 1, agi: 0.5 },
        skills: [],
        weight: 1,
        attackType: 'melee',
      },
    ],
  },
  rare: {
    bonus: 1.2,
    weight: 375,
    subClasses: [
      {
        id: 'skeleton_shield_bearer',
        name: '방패병',
        orderWeight: 4,
        statMod: { atk: 0.6, def: 2.5, hp: 2, agi: 0.7 },
        skills: [],
        weight: 2,
        attackType: 'melee',
      },
      {
        id: 'skeleton_swordsman',
        name: '검사',
        orderWeight: 15,
        statMod: { atk: 1.2, def: 1, hp: 1.5, agi: 0.9 },
        skills: ['power_smash'],
        weight: 1,
        attackType: 'melee',
      },
      {
        id: 'skeleton_pyromancer',
        name: '화염술사',
        orderWeight: 30,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 0.8 },
        skills: ['fire_bolt'],
        weight: 1,
        attackType: 'ranged',
      },
      {
        id: 'skeleton_healer',
        name: '힐러',
        orderWeight: 30,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 0.8 },
        skills: ['minor_heal'],
        weight: 1,
        attackType: 'ranged',
      },
    ],
  },
  elite: {
    bonus: 1.4,
    weight: 100,
    subClasses: [
      {
        id: 'skeleton_great_shield_bearer',
        name: '대형 방패병',
        orderWeight: 5,
        statMod: { atk: 0.8, def: 2.8, hp: 2.5, agi: 0.7 },
        skills: ['shield_bash'],
        weight: 4,
        attackType: 'melee',
      },
      {
        id: 'skeleton_archer',
        name: '궁수',
        orderWeight: 25,
        statMod: { atk: 1.3, def: 1, hp: 1, agi: 0.9 },
        skills: ['aim_arrow'],
        weight: 3,
        attackType: 'ranged',
      },
      {
        id: 'skeleton_cryomancer',
        name: '빙결술사',
        orderWeight: 30,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 0.6 },
        skills: ['ice_bolt'],
        weight: 2,
        attackType: 'ranged',
      },
      {
        id: 'skeleton_monk',
        name: '수도자',
        orderWeight: 35,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 0.5 },
        skills: ['heal'],
        weight: 3,
        attackType: 'ranged',
      },
    ],
  },
  epic: {
    bonus: 1.5,
    weight: 20,
    subClasses: [
      {
        id: 'skeleton_warrior',
        name: '워리어',
        orderWeight: 7,
        statMod: { atk: 1.5, def: 1.2, hp: 1.2, agi: 0.65 },
        skills: ['whirlwind'],
        weight: 3,
        attackType: 'melee',
      },
      {
        id: 'skeleton_electromancer',
        name: '전격술사',
        orderWeight: 30,
        statMod: { atk: 1.5, def: 0.9, hp: 1.0, agi: 0.55 },
        skills: ['lightning_bolt', 'lightning_storm'],
        weight: 3,
        attackType: 'ranged',
      },
      {
        id: 'skeleton_priest',
        name: '사제',
        orderWeight: 45,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 0.65 },
        skills: ['holy_radiance'],
        weight: 3,
        attackType: 'ranged',
      },
    ],
  },
  legendary: {
    bonus: 1.8,
    weight: 5,
    subClasses: [
      {
        id: 'skeleton_king',
        name: '해골 왕',
        orderWeight: 55,
        statMod: { atk: 1.6, def: 1.5, hp: 1.5, agi: 0.5 },
        skills: ['death_aura'],
        weight: 1,
        attackType: 'melee',
      },
    ],
  },
}

export const INIT_MAX_MEMORIZE_COUNT = 5

export const SKELETON_UPGRADE = {
  MIN_LIMIT: 2,
  MAX_LIMIT: 5,
  COSTS: {
    2: 500, // 2->3구 확장 비용
    3: 2000, // 3->4구 확장 비용
    4: 4000, // 4->5구 확장 비용
  } as Record<number, number>,
}

export const SUBSPACE_UPGRADE = {
  MIN_LIMIT: 2,
  MAX_LIMIT: 5,
  COSTS: {
    2: 500, // 2->3구 확장 비용
    3: 2000, // 3->4구 확장 비용
    4: 4000, // 4->5구 확장 비용
  } as Record<number, number>,
}
