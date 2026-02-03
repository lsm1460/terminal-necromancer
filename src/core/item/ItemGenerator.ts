import { Affix, ArmorItem, Drop, ItemType, WeaponItem } from '../../types'
import { generateId } from '../../utils'
import { AFFIX_LIST } from '../affixes'
import { ItemRarity, RARITY_SETTINGS } from './consts'

export class ItemGenerator {
  /** 1. 가중치 기반 등급 결정 (minRarity 고려) */
  private rollRarity(
    minRarity: ItemRarity = 'COMMON',
    maxRarity: ItemRarity = 'EPIC' // 기본 최대치는 EPIC
  ): ItemRarity {
    const roll = Math.random() * 100
    let rolled: ItemRarity

    // 1. 기본 확률 주사위
    if (roll < 3) rolled = 'EPIC'
    else if (roll < 20) rolled = 'RARE'
    else rolled = 'COMMON'

    // 2. 등급 우선순위 정의
    const rarityOrder: Record<ItemRarity, number> = {
      COMMON: 0,
      RARE: 1,
      EPIC: 2,
    }

    // 3. 범위 보정 (Clamping)
    // 결과가 최소 등급보다 낮으면 최소 등급으로 승격
    if (rarityOrder[rolled] < rarityOrder[minRarity]) {
      rolled = minRarity
    }

    // 결과가 최대 등급보다 높으면 최대 등급으로 강등
    if (rarityOrder[rolled] > rarityOrder[maxRarity]) {
      rolled = maxRarity
    }

    return rolled
  }

  /** 2. 수치 확정 함수 (범위형 스탯 처리) */
  private finalizeStat(range: [number, number]): number {
    const [min, max] = range
    // 0.02 ~ 0.08 범위를 2 ~ 8 정수 범위로 변환
    const precision = 100
    const minInt = Math.round(min * precision)
    const maxInt = Math.round(max * precision)

    // 정수 범위에서 랜덤 추출 후 다시 소수점으로 변환
    const randomInt = Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt
    return randomInt / precision
  }

  /** 3. 성능 접두사 판단 (상/하위 15%) */
  private getPerformancePrefix(value: number, min: number, max: number): string {
    const range = max - min
    if (range <= 0) return ''
    const highThreshold = max - range * 0.15
    const lowThreshold = min + range * 0.15

    if (value >= highThreshold) return '장인의 '
    if (value <= lowThreshold) return '낡은 '
    return ''
  }

  /** 4. 어픽스 랜덤 선택 (에픽 전용) */
  private pickRandomAffix(): Affix {
    const keys = Object.keys(AFFIX_LIST)
    const randomKey = keys[Math.floor(Math.random() * keys.length)]
    const affixData = AFFIX_LIST[randomKey]

    let finalValue = undefined
    if (affixData.valueRange) {
      finalValue = this.finalizeStat(affixData.valueRange)
    }

    return { ...affixData, value: finalValue }
  }

  /** 5. 메인 생성 로직 */
  public createItem(baseItem: Drop) {
    if (![ItemType.WEAPON, ItemType.ARMOR].includes(baseItem.type)) {
      return baseItem
    }

    // [보정] baseItem에 지정된 최소 등급을 적용하여 굴림
    const rarityKey = this.rollRarity(baseItem.minRarity, baseItem?.maxRarity)
    const setting = RARITY_SETTINGS[rarityKey]

    let finalStats: Partial<{ atk: number; def: number; eva: number; crit: number }> = {}
    let mainValue = 0
    let mainRange: [number, number] = [0, 0]

    // [스탯 결정] 무기 vs 방어구
    if (baseItem.type === 'weapon') {
      mainRange = baseItem.atkRange || [0, 0]
      mainValue = this.finalizeStat(mainRange)
      finalStats = {
        atk: Math.floor(mainValue * setting.multiplier),
        crit: baseItem.critRange ? this.finalizeStat(baseItem.critRange) : 0,
      }
    } else {
      mainRange = baseItem.defRange || [0, 0]
      mainValue = this.finalizeStat(mainRange)
      finalStats = {
        def: Math.floor(mainValue * setting.multiplier),
        eva: baseItem.evaRange ? this.finalizeStat(baseItem.evaRange) : 0,
      }
    }

    // [이름 구성 요소]
    const perfPrefix = this.getPerformancePrefix(mainValue, mainRange[0], mainRange[1])
    const adjective =
      setting.adjectives.length > 1 && setting.adjectives[0] !== ''
        ? setting.adjectives[Math.floor(Math.random() * setting.adjectives.length)] + ' '
        : ''

    let affix: Affix | undefined
    let affixBracket = ''
    if (setting.hasAffix) {
      const _affix = this.pickRandomAffix()
      affix = _affix
      affixBracket = `[${_affix.name}] `
    }

    // [라벨 조립]
    const finalLabel = [
      setting.color,
      setting.symbol,
      ' ',
      affixBracket,
      adjective,
      perfPrefix,
      baseItem.label,
      '\x1b[0m',
    ]
      .join('')
      .replace(/\s+/g, ' ')
      .trim()

    return {
      ...baseItem,
      ...finalStats,
      id: generateId(baseItem.id),
      rarity: rarityKey,
      label: finalLabel,
      affix,
    } as WeaponItem | ArmorItem
  }
}
