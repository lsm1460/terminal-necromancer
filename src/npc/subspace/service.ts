import { SKELETON_UPGRADE } from '~/consts'
import { getOriginId } from '~/core/utils'

export const SubspaceService = {
  /** 해골 소환 제한 확장 비용 및 가능 여부 계산 */
  getUpgradeInfo(player: any) {
    const currentLimit = player._maxSkeleton || SKELETON_UPGRADE.MIN_LIMIT
    const isMax = currentLimit >= SKELETON_UPGRADE.MAX_LIMIT
    const cost = isMax ? 0 : SKELETON_UPGRADE.COSTS[currentLimit]
    return { currentLimit, isMax, cost }
  },

  /** 합성(Mix) 가능 여부 확인 (동일 클래스 2개 이상 존재 시) */
  getMixableGroups(player: any) {
    const counts = player.skeleton.reduce((acc: any, sk: any) => {
      const originId = getOriginId(sk.id)
      acc[originId] = (acc[originId] || 0) + 1
      return acc
    }, {})
    return Object.values(counts).some((count: any) => count >= 2)
  },

  /** 합성 성공 확률 반환 */
  getMixSuccessChance(rarity: string = 'common'): number {
    const chanceMap: Record<string, number> = {
      common: 0.8, rare: 0.5, elite: 0.3, epic: 0.1,
    }
    return chanceMap[rarity] || 0
  }
}