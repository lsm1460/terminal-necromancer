import { Terminal } from '~/core'
import { INpcManager, NPCState } from '~/core/types'
import i18n from '~/i18n'
import { Ending } from '~/systems'
import { GameNPC } from '~/systems/npc/GameNPC'
import { AppContext } from '~/systems/types'
import { delay, speak } from '~/utils'

export class FourthBossNPC extends GameNPC {
  constructor(id: string, baseData: any, state: NPCState, manager: INpcManager) {
    super(id, baseData, state, manager)
  }

  getChoices(context: AppContext) {
    return []
  }

  hasQuest(context: AppContext) {
    return false
  }

  async handle(action: string, context: AppContext) {
    return true
  }

  async afterDead(context: AppContext) {
    const { events, npcs, battle, world } = context
    const caronIsDead = events.isCompleted('caron_is_dead')
    const caronIsMine = events.isCompleted('caron_is_mine')
    const isResistanceDead = !events.isCompleted('third_boss_resistance')
    const killAll = events.isCompleted('third_boss_kill_all')
    
    if (isResistanceDead && caronIsMine) {
      await speak(i18n.t('npc.fourth_boss.caron_distrust', { returnObjects: true }) as string[])

      const _res = await Terminal.confirm(i18n.t('npc.fourth_boss.system.move_confirm'))

      if (!_res) {
        await speak(i18n.t('npc.fourth_boss.caron_battle_start', { returnObjects: true }) as string[])
        npcs.setAlive('caron')
        const caron = npcs.getNPC('caron')
        const unit = battle.toCombatUnit(caron!, 'npc')
        const _isWin = await battle.runCombatLoop([unit], world)
        
        if (_isWin) {
          events.completeEvent('caron_is_dead')

          if (!killAll) {
            await Ending.run(context)

            return 'exit'
          }
        }
      } else {
        await speak(i18n.t('npc.fourth_boss.caron_cooperate_after_slaughter', { returnObjects: true }) as string[])
      }
    } else if (!killAll && isResistanceDead && caronIsDead) {
      await Ending.run(context)

      return 'exit'
    }

    Terminal.clear()
    await delay()
    await speak(i18n.t('npc.fourth_boss.awakening', { returnObjects: true }) as string[])
  }
}
