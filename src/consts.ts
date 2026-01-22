import { Direction, Vector } from './types'

export const COMMAND_KEYS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  ATTACK: 'attack',
  PICK: 'pick',
  DROP: 'drop',
  HELP: 'help',
  INVENTORY: 'inventory',
  EQUIP: 'equip',
  USE: 'use',
  STATUS: 'status',
  LOOK: 'look',
  CLEAR: 'clear',
  SKILL: 'skill',
  TALK: 'talk', // 대화 추가
  EXIT: 'exit',
  MAP: 'map',
} as const

export type CommandKey = (typeof COMMAND_KEYS)[keyof typeof COMMAND_KEYS]

export const COMMAND_GROUPS: Record<CommandKey, string[]> = {
  [COMMAND_KEYS.UP]: ['up', '위', 'u', '위로', '올라가기', '북', '북쪽', 'north', 'n'],
  [COMMAND_KEYS.DOWN]: ['down', '아래', 'd', 'b', '아래로', '내려가기', '남', '남쪽', 'south'],
  [COMMAND_KEYS.LEFT]: ['left', '왼쪽', 'l', '좌', '좌측', '서', '서쪽', 'west', 'w'],
  [COMMAND_KEYS.RIGHT]: ['right', '오른쪽', 'r', 'e', '우', '우측', '동', '동쪽', 'east'],
  [COMMAND_KEYS.ATTACK]: ['attack', '공격', 'atk', 'hit', '때리기', '공격하기'],
  [COMMAND_KEYS.PICK]: ['pick', 'p', '줍기', '획득', '집기', '들기'],
  [COMMAND_KEYS.DROP]: ['drop', 'dr', '버리기'],
  [COMMAND_KEYS.HELP]: ['help', '도움말', '/?', '도움', '명령', '명령어'],
  [COMMAND_KEYS.INVENTORY]: ['inventory', 'inven', 'i', '인벤토리', '가방', '아이템', '소지품'],
  [COMMAND_KEYS.EQUIP]: ['equip', '장비', 'eq'],
  [COMMAND_KEYS.USE]: ['use', '사용', '먹기'],
  [COMMAND_KEYS.STATUS]: ['status', '스탯', '상태', 'stat', '정보', '정보창'],
  [COMMAND_KEYS.LOOK]: ['look', '보기', '보다', '확인', '조사', '관찰'],
  [COMMAND_KEYS.CLEAR]: ['clear', 'cls', '화면지우기'],
  [COMMAND_KEYS.SKILL]: ['skill', '스킬', '마법', 'sk'],
  [COMMAND_KEYS.TALK]: ['talk', '대화', 'tk'],
  [COMMAND_KEYS.MAP]: ['map', '지도', 'm'],
  [COMMAND_KEYS.EXIT]: ['exit'],
}

export const DIRECTIONS: Record<Direction, Vector> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

export const HOSTILITY_LIMIT = 100

export const MAP_IDS = {
  title: 'title',
  B1_SUBWAY: 'B1_Subway_Entrance',
  B2_TRANSIT: 'B2_Transit_Area',
  B3_STEEL_DOCK: 'B3_Steel_Loading_Dock',
  B3_5_RESISTANCE_BASE: 'B3_5_Resistance_Base',
  B4_Celestial_Transit_Lounge: 'B4_Celestial_Transit_Lounge'
} as const

export type SkeletonRarity = 'common' | 'rare' | 'elite' | 'epic' | 'legendary'

type SubClass = {
  name: string
  statMod: { atk: number; def: number; hp: number; agi: number }
  skills: string[]
  weight: number
  orderWeight: number
}

export const RARITY_DATA: Record<SkeletonRarity, { bonus: number; weight: number; subClasses: SubClass[] }> = {
  common: {
    bonus: 0.8,
    weight: 625,
    subClasses: [{ name: '병사', orderWeight: 10, statMod: { atk: 1, def: 1, hp: 1, agi: 1 }, skills: [], weight: 1 }],
  },
  rare: {
    bonus: 1.0,
    weight: 250,
    subClasses: [
      {
        name: '검사',
        orderWeight: 15,
        statMod: { atk: 1.2, def: 1, hp: 1, agi: 1.1 },
        skills: ['power_smash'],
        weight: 1,
      },
    ],
  },
  elite: {
    bonus: 1.2,
    weight: 100,
    subClasses: [
      {
        name: '방패병',
        orderWeight: 5,
        statMod: { atk: 0.8, def: 1.5, hp: 1.3, agi: 0.7 },
        skills: ['shield_Bash'],
        weight: 5,
      },
      {
        name: '궁수',
        orderWeight: 25,
        statMod: { atk: 1.3, def: 0.7, hp: 0.8, agi: 1.5 },
        skills: ['piercing_arrow'],
        weight: 4,
      },
      {
        name: '수도자',
        orderWeight: 35,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 1.1 },
        skills: ['dark_heal'],
        weight: 1,
      },
    ],
  },
  epic: {
    bonus: 1.5,
    weight: 20,
    subClasses: [
      {
        name: '워리어',
        orderWeight: 7,
        statMod: { atk: 1.5, def: 1.2, hp: 1.2, agi: 1.0 },
        skills: ['whirlwind'],
        weight: 9,
      },
      {
        name: '사제',
        orderWeight: 45,
        statMod: { atk: 0.6, def: 0.9, hp: 1.0, agi: 1.1 },
        skills: ['holy_radiance'],
        weight: 1,
      },
    ],
  },
  legendary: {
    bonus: 2.0,
    weight: 5,
    subClasses: [
      {
        name: '해골 왕',
        orderWeight: 55,
        statMod: { atk: 2.0, def: 1.5, hp: 1.5, agi: 1.5 },
        skills: ['death_aura'],
        weight: 1,
      },
    ],
  },
}

export const INIT_MAX_MEMORIZE_COUNT = 4