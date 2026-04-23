import { DIRECTIONS } from '~/consts'
import { Terminal } from '~/core/Terminal'
import { CommandFunction } from '~/core/types'
import i18n from '~/i18n'

// --- 공통 이동 함수 ---
export const moveCommand = (direction: keyof typeof DIRECTIONS): CommandFunction => {
  return async (args, context) => {
    const { player, map, npcs, cheats, currentTile: tile } = context
    const { monsters, npcIds } = tile || {}

    // 1. 길을 막고 있는 몬스터 찾기
    const blockingMonster = monsters?.find((m) => m.isAlive && m.noEscape)

    // 2. 길을 막고 있는 NPC 찾기 (적대적 + 살아있음 + 도망불가)
    const blockingNPC = (npcIds || [])
      .map((id) => npcs.getNPC(id))
      .find((npc) => npc && npc.isAlive && npc.isHostile && npc.noEscape)

    // 3. 둘 중 하나라도 존재하면 해당 타겟을 변수에 담기
    const blockingTarget = blockingMonster || blockingNPC
    const cannotPass = !cheats.playerIsHide && blockingTarget

    if (cannotPass) {
      Terminal.log(i18n.t('commands.move.cannot_escape', { name: blockingTarget.name }))
      return false
    }

    const { dx, dy } = DIRECTIONS[direction]
    const { x, y } = player.pos

    if (map.canMove({ x: x + dx, y: y + dy })) {
      await context.broadcast.play()
      player.move(dx, dy)
      return true
    }

    Terminal.log('> ' + i18n.t('commands.move.you_cannot_pass'))
    return false
  }
}
