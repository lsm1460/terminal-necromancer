import { Affix } from '~/types'

export const AFFIX_LIST: Record<string, Affix> = {
  SURPRISE_ATTACK: {
    id: 'SURPRISE_ATTACK'
  },
  OVERLORD: {
    id: 'OVERLORD',

    valueRange: [1, 4], // 생성 시 1~4 랜덤 부여,
    metadata: {
      needsConfirmOnUnequip: true,
      unEquipCaution: '장비 해제 시 소환된 스켈레톤 중 일부가 영혼으로 돌아갑니다.',
    },
  },
  ELITE_SQUAD: {
    id: 'ELITE_SQUAD',
    valueRange: [1, 2], // 생성 시 1~2 랜덤 부여
  },
  DOOMSDAY: {
    id: 'DOOMSDAY',
  },
  FROSTBORNE: {
    id: 'FROSTBORNE',
  },
  LEGION: {
    id: 'LEGION',
  },
  THORNS: {
    id: 'THORNS',
  },
  ROAR: {
    id: 'ROAR',
  },
  TABOO: {
    id: 'TABOO',
  },
  WARHORSE: {
    id: 'WARHORSE',
  },
  CORROSION: {
    id: 'CORROSION',
  },
  WIDE_CURSE: {
    id: 'WIDE_CURSE',
  },
  CHAIN_EXPLOSION: {
    id: 'CHAIN_EXPLOSION',
  },
  VAMPIRISM: {
    id: 'VAMPIRISM',
  },
  EXALTATION: {
    id: 'EXALTATION',
  },
  BLOOD: {
    id: 'BLOOD',
  },
  RESURRECTION: {
    id: 'RESURRECTION',
  },
  MEMORY: {
    id: 'MEMORY',
    valueRange: [1, 2], // 생성 시 1~2 랜덤 부여
    metadata: { needsConfirmOnUnequip: true, unEquipCaution: '장비 해제 시 각인된 마법 일부가 사라집니다.' },
  },
  CLEANSE: {
    id: 'CLEANSE',
  },
}
