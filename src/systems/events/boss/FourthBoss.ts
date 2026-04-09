import { MAP_IDS } from '~/consts'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameContext, NPC } from '~/types'
import { speak } from '~/utils'
import { BossLogic } from './BossLogic'

export class FourthBoss implements BossLogic {
  withResistance = false

  get postTalk() {
    return i18n.t('npc.third_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: NPC, context: GameContext, player: Player) {
    const { npcs, events, battle, monster } = context

    const maya = npcs.getNPC('maya_tech')
    if (maya?.skills) maya.skills = [...(maya.skills || []), ''] // 회복 마법 추가
    const mayaIsAlive = maya?.isAlive
    const isResistanceDead = events.isCompleted('vips_saved')

    if (!mayaIsAlive) {
      // 폭주하는 신의 잔재
      //  일정 확률로 보스가 폭주 중, 200? 300? 이상의 데미지를 입으면 보스에게 혼란 부여
      // 폭주 시 공격력 증가, 체력 감소 type dot dot 음수값 atk 양
      // god1Unit.applyBuff({
      //   id: 'overdrive',
      //   type: 'dot',
      //   atk: 20,
      //   dot: 10,
      //   duration: 3 + 1, // 행동 시작 시 차감 고려
      // })

      const god1 = monster.makeMonster('fallen_god_1')
      return []
    }

    if (isResistanceDead) {
      const mayaUnit = battle.toCombatUnit(maya, 'npc')
      // 마야, 골렘, 불안전한 신의 잔재
      // 골렘이 살아있는 동안 마야를 죽이지 못함
      // 마야가 쓰러진다면, 일정 확률로 보스가 폭주 중, 200 이상의 데미지를 입으면 보스에게 혼란 부여
      // const boss2 = npcs.getNPC('fallen_god_2')
      return [mayaUnit]
    }

    const _res = await Terminal.confirm('합류하시겠습니까?')
    if (_res) {
      this.withResistance = true
      return []
    } else {
      // 신의 잔재와 생존 중인 레지스탕스
      // 죽은 신의 가호: 신이 죽기 전까지 레지스탕스의 방어력과 공격력, dot힐
      // resistance.applyBuff({
      //   id: 'grace',
      //   type: 'dot',
      //   atk: 30,
      //   def: 40,
      //   dot: -30,
      //   duration: 3 + 1, // 행동 시작 시 차감 고려
      // })
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
        await map.changeScene(MAP_IDS.B1_Last, context)
      } else {
        await speak(['네가 준비되었을 때 사신을 공격한다면 우리도 합류하겠다는 이야기'])
      }
    }
  }
}
