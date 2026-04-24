import { BeforeMoveCallback, createMoveCommand, MoveBlockerCheckFn } from '~/commands/move'
import { DIRECTIONS } from '~/core/consts'
import { GameEventType, ICommandManager, ICommandSystem } from '~/core/types'
import { AppContext } from '../types'

export class MoveSystem implements ICommandSystem {
  constructor(private context: AppContext) {}

  install(handler: ICommandManager) {
    const directions: (keyof typeof DIRECTIONS)[] = ['up', 'down', 'left', 'right']

    directions.forEach((dir) => {
      // 각 방향마다 App 전용 장애물 체크 로직을 주입하여 등록
      handler.register(dir, createMoveCommand(dir, {
        blockerCheck: this.checkMoveBlocker,
        beforeMove: this.beforeMove
      }))
    })
  }

  private checkMoveBlocker: MoveBlockerCheckFn = () => {
    const { npcs, cheats, currentTile: tile } = this.context
    
    if (cheats.playerIsHide) {
      return null
    }

    const { monsters, npcIds } = tile || {}

    const blockingMonster = monsters?.find((m) => m.isAlive && m.noEscape)
    if (blockingMonster) {
      return blockingMonster.name
    }

    const blockingNPC = (npcIds || [])
      .map((id) => npcs.getNPC(id))
      .find((npc) => npc && npc.isAlive && npc.isHostile && npc.noEscape)

    if (blockingNPC) {
      return blockingNPC.name
    }

    return null
  }

  private beforeMove: BeforeMoveCallback = () => {
    this.context.eventBus.emitAsync(GameEventType.PLAYER_MOVE, { npcs: this.context.npcs })
  }
}