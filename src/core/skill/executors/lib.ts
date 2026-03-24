import { CombatUnit } from "~/core/battle/unit/CombatUnit"
import { Player } from "~/core/player/Player"
import { Terminal } from "~/core/Terminal"
import i18n from "~/i18n"

export function sacrificeSkeleton(player: CombatUnit<Player>, skeletonId: string) {
  const isResurrection = player.ref.hasAffix('RESURRECTION')
  const target = player.ref.skeleton.find((sk) => sk.id === skeletonId)

  if (!target) return null

  if (isResurrection) {
    const minHp = Math.floor(target.maxHp * 0.1) // 최대 체력의 10%

    target.hp = Math.min(target.hp, minHp)
  } else {
    // 상태 변경 및 제거
    target.hp = 0
    target.isAlive = false
    player.ref.removeMinion(skeletonId)
  }

  return target
}

export const failWithLog = (i18nKey: string) => {
  Terminal.log(i18n.t(i18nKey))
  return { isSuccess: false, isAggressive: false, gross: 0 }
}