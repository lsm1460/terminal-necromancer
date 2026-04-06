import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { BattleTarget, GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { BossLogic } from './BossLogic'
import { MAP_IDS } from '~/consts'

export class FourthBoss implements BossLogic {
  withResistance = false

  get postTalk() {
    return i18n.t('npc.third_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: NPC, context: GameContext, player: Player) {
    const { npcs, events, battle } = context

    const maya = npcs.getNPC('maya_tech')
    const mayaIsAlive = maya?.isAlive
    const isResistanceDead = events.isCompleted('vips_saved')

    if (!mayaIsAlive) {
      // 완성되지 못한 신의 잔재
      // const boss1 = npcs.getNPC('fallen_god_1')
      return []
    }

    if (isResistanceDead) {
      const mayaUnit = battle.toCombatUnit(maya, 'npc')
      //골렘들, 불안전한 신의 잔재
      // const boss2 = npcs.getNPC('fallen_god_2')
      return [mayaUnit]
    }

    const _res = await Terminal.confirm('합류하시겠습니까?')
    if (_res) {
      this.withResistance = true
      return []
    } else {
      // 신의 잔재와 생존 중인 레지스탕스
      // const boss2 = npcs.getNPC('fallen_god_2')
      return []
    }
  }

  async onVictory(bossNpc: NPC, context: GameContext, player: Player) {
    const { map, npcs } = context

    const boss = npcs.getNPC('fourth_boss')

    boss && boss.dead({ karma: 0 })

    if (this.withResistance) {
      player.restoreAll()
      Terminal.log('모두 회복되었다.')

      await speak(['이래저래 해서 마지막 최종장이라는 뜻'])

      const _res = await Terminal.confirm('바로 이동 ㄱ 하실?')

      if (_res) {
        await map.changeScene(MAP_IDS.B1_Last, player, context)
      } else {
        await speak(['네가 준비되었을 때 사신을 공격한다면 우리도 합류하겠다는 이야기'])
      }
    }
  }
}
