import i18n from '~/i18n'
import { Affix } from '~/types/item'

export const getAffixList = (): Record<string, Affix> => {
  return {
    SURPRISE_ATTACK: {
      id: 'SURPRISE_ATTACK',
    },
    OVERLORD: {
      id: 'OVERLORD',

      valueRange: [1, 4], // 생성 시 1~4 랜덤 부여,
      metadata: {
        needsConfirmOnUnequip: true,
        unEquipCaution: i18n.t('affix.OVERLORD.unEquipCaution'),
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
      metadata: {
        needsConfirmOnUnequip: true,
        unEquipCaution: i18n.t('affix.OVERLORD.unEquipCaution'),
      },
    },
    CLEANSE: {
      id: 'CLEANSE',
    },
    ALONE: {
      id: 'ALONE',
    },
  }
}

export const getAffixCaution = (id: string) => {
  const list = getAffixList()

  return list[id].metadata?.unEquipCaution
}
