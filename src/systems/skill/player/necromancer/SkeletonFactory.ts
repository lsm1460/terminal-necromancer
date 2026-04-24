import { RARITY_DATA, SkeletonRarity } from '~/consts'
import { Corpse } from '~/core'
import i18n from '~/i18n'
import { SkeletonBase } from '~/types'

export const SKELETON_RARITIES: SkeletonRarity[] = ['common', 'rare', 'elite', 'epic', 'legendary']

export class SkeletonFactory {
  rarities: SkeletonRarity[] = ['common', 'rare', 'elite', 'epic', 'legendary']

  static createFromCorpse(corpse: Corpse, minIdx: number = 0): SkeletonBase {
    // 가중치 기반으로 랜덤 등급 선택
    const pool = SKELETON_RARITIES.slice(Math.min(minIdx, SKELETON_RARITIES.length - 1)) // 최소 등급 이상만 필터링
    const totalWeight = pool.reduce((sum, r) => sum + RARITY_DATA[r].weight, 0)
    let random = Math.random() * totalWeight

    let finalRarity = pool[0]
    for (const r of pool) {
      if (random < RARITY_DATA[r].weight) {
        finalRarity = r
        break
      }
      random -= RARITY_DATA[r].weight
    }

    const rarityInfo = RARITY_DATA[finalRarity]

    // 2. 해당 등급 내 서브 클래스 결정
    const totalSubWeight = rarityInfo.subClasses.reduce((sum, s) => sum + s.weight, 0)
    let subRandom = Math.random() * totalSubWeight
    let selectedClass = rarityInfo.subClasses[0]

    for (const sub of rarityInfo.subClasses) {
      if (subRandom < sub.weight) {
        selectedClass = sub
        break
      }
      subRandom -= sub.weight
    }

    // 3. 스켈레톤 데이터 생성 (시체의 능력치에 비례하거나 고정값)
    const m = rarityInfo.bonus
    const s = selectedClass.statMod

    const rarityColors: Record<SkeletonRarity, string> = {
      common: '\x1b[37m', // 하얀색
      rare: '\x1b[32m', // 초록색
      elite: '\x1b[34m', // 파란색
      epic: '\x1b[35m', // 보라색
      legendary: '\x1b[33m', // 노란색(금색)
    }

    const resetColor = '\x1b[0m'
    const color = rarityColors[finalRarity] || rarityColors.common
    const rarityTag = `${color}[${finalRarity.toUpperCase()}]${resetColor}`

    const skeleton = {
      id: `${selectedClass.id}::${Date.now()}`,
      name: `${rarityTag} skeleton ${selectedClass.name}`,
      attackType: selectedClass.attackType,
      maxHp: Math.floor(corpse.maxHp * 0.8 * m * s.hp),
      hp: Math.floor(corpse.maxHp * 0.8 * m * s.hp),
      atk: Math.max(Math.floor(corpse.atk * m * s.atk), 8),
      def: Math.max(Math.floor(corpse.def * m * s.def), 5),
      agi: Math.floor(corpse.agi * m * s.agi),
      eva: 0,
      skills: [...selectedClass.skills],
      exp: 0,
      description: i18n.t('npc.skeleton.description', { name: corpse.name }),
      originId: corpse.id,
      rarity: finalRarity,
      dropTableId: '',
      encounterRate: 0,
      isAlive: true,
      isMinion: true,
      isSkeleton: true,
      orderWeight: selectedClass.orderWeight,
    }

    return skeleton
  }
}
