import { Affix } from '../../types'

export const AFFIX_LIST: Record<string, Affix> = {
  SURPRISE_ATTACK: {
    id: 'SURPRISE_ATTACK',
    name: '기습',
    description: '뼈 창이 적 진형의 뒤에서 날아옵니다.',
  },
  OVERLORD: {
    id: 'OVERLORD',
    name: '군주',
    description: '스켈레톤 보유 수가 증가합니다.',

    valueRange: [1, 4], // 생성 시 1~4 랜덤 부여,
    metadata: {
      needsConfirmOnUnequip: true,
      unEquipCaution: '장비 해제 시 소환된 스켈레톤 중 일부가 영혼으로 돌아갑니다.',
    },
  },
  ELITE_SQUAD: {
    id: 'ELITE_SQUAD',
    name: '정예',
    description: '스켈레톤 생성 등급이 향상됩니다.',
    valueRange: [1, 2], // 생성 시 1~2 랜덤 부여
  },
  DOOMSDAY: {
    id: 'DOOMSDAY',
    name: '종말',
    description: '스켈레톤이 죽을 때 폭발하여 주변에 피해를 입힙니다.',
  },
  FROSTBORNE: {
    id: 'FROSTBORNE',
    name: '서리',
    description: '서리 서린 스켈레톤의 손길이 적의 발걸음을 무겁게 합니다.',
  },
  LEGION: {
    id: 'LEGION',
    name: '군단',
    description: '스켈레톤 부활 시 사역 가능한 수만큼의 시체를 동시에 부활시킵니다.',
  },
  THORNS: {
    id: 'THORNS',
    name: '가시',
    description: '골렘에게 가시가 돋아나 골렘을 공격하는 적에게도 상처를 줍니다.',
  },
  ROAR: {
    id: 'ROAR',
    name: '포효',
    description: '골렘이 적의 후열 공격을 자신에게 집중시킵니다.',
  },
  TABOO: {
    id: 'TABOO',
    name: '금기',
    description: '다크나이트를 리치로 전직시키고 전용 스킬(시폭, 뼈감옥)을 해금합니다.',
  },
  WARHORSE: {
    id: 'WARHORSE',
    name: '군마',
    description: '다크나이트의 공격이 전체 공격으로 전환됩니다.',
  },
  CORROSION: {
    id: 'CORROSION',
    name: '부식',
    description: '저주의 효과가 공격력 감소에서 방어력 감소로 변경됩니다.',
  },
  WIDE_CURSE: {
    id: 'WIDE_CURSE',
    name: '광역',
    description: '저주의 효과가 낮아지지만 모든 적에게 부여됩니다.',
  },
  CHAIN_EXPLOSION: {
    id: 'CHAIN_EXPLOSION',
    name: '연쇄',
    description: '시체 폭발 시 스켈레톤을 포함한 전장의 모든 시체가 연쇄 폭발합니다.',
  },
  VAMPIRISM: {
    id: 'VAMPIRISM',
    name: '흡혈',
    description: '영혼 흡수 시 자신의 체력을 회복합니다.',
  },
  EXALTATION: {
    id: 'EXALTATION',
    name: '고양',
    description: '영혼 전달 시 미니언에게 강력한 버프를 주지만 체력을 소모시킵니다.',
  },
  BLOOD: {
    id: 'BLOOD',
    name: '혈마법',
    description: 'MP를 모두 체력으로 전환하고 최대 체력을 30% 증가시킵니다.',
  },
  RESURRECTION: {
    id: 'RESURRECTION',
    name: '부활',
    description: '뼈 기술 사용 후 소모되었던 미니언을 10%의 체력으로 즉시 부활시킵니다.',
  },
  MEMORY: {
    id: 'MEMORY',
    name: '기억',
    description: '메모라이즈 슬롯 수가 증가합니다.',
    valueRange: [1, 2], // 생성 시 1~2 랜덤 부여
    metadata: { needsConfirmOnUnequip: true, unEquipCaution: '장비 해제 시 각인된 마법 일부가 사라집니다.' },
  },
  CLEANSE: {
    id: 'CLEANSE',
    name: '해주',
    description: '스켈레톤 사제나 수도자가 아군의 디버프를 해제합니다.',
  },
}
