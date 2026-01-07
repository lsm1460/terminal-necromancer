import { Direction, SKILL_IDS, SkillId, Vector } from './types'

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
  [COMMAND_KEYS.EXIT]: ['exit'],
}

export const DIRECTIONS: Record<Direction, Vector> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

export const SKILL_GROUPS: Record<SkillId, string[]> = {
  [SKILL_IDS.RAISE_SKELETON]: ['스켈레톤', 'skeleton', 'sk', '강령', '되살리기'],
  [SKILL_IDS.CORPSE_EXPLOSION]: ['시체폭발', 'explosion', 'ex', '시폭', '터뜨리기'],
  [SKILL_IDS.SOUL_HARVEST]: ['영혼수확', 'harvest', '영흡', '정수흡수'],
}

export const HOSTILITY_LIMIT = 100