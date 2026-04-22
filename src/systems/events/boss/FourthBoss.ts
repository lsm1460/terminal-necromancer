import { MAP_IDS } from '~/consts'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Ending } from '~/core/Ending'
import { BaseNPC } from '~/core/npc/BaseNPC'
import { Terminal } from '~/core/Terminal'
import { GameEventType } from '~/core/types'
import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { speak } from '~/utils'
import { BossLogic } from './BossLogic'

export class FourthBoss implements BossLogic {
  withResistance = false

  get postTalk() {
    return i18n.t('npc.fourth_boss.postTalk', { returnObjects: true }) as string[]
  }

  async createEnemies(bossNpc: BaseNPC, context: AppContext) {
    const { npcs, events, battle, monster } = context

    const maya = npcs.getNPC('maya_tech')
    if (maya?.skills) maya.skills = [...(maya.skills || []), 'greater_heal'] // 회복 마법 추가
    const mayaIsAlive = maya?.isAlive
    const isResistanceDead = events.isCompleted('vips_saved')

    if (!mayaIsAlive) {
      const god1 = monster.makeMonster('fallen_god_1')!

      const god1Unit = battle.toCombatUnit(god1, 'monster')

      const groupUnits = monster
        .makeMonsters('monster-b6-fragment')
        .sort(() => Math.random() - 0.5) // 무작위 섞기
        .slice(0, 4)
        .map((monster) => battle.toCombatUnit(monster, 'monster'))

      return [...groupUnits, god1Unit]
    }

    if (isResistanceDead) {
      await speak(i18n.t('npc.fourth_boss.encounter_maya', { returnObjects: true }) as string[])

      const mayaUnit = battle.toCombatUnit(maya, 'npc')

      mayaUnit.applyBuff({
        id: 'stealth',
        type: 'stealth',
        duration: Infinity,
        isLocked: true,
      })

      const amor = monster.makeMonster('maya_golem')
      const amorUnit = battle.toCombatUnit(amor!, 'monster')

      amorUnit.onDeathHooks.push(async () => {
        mayaUnit.removeBuff('stealth', true)

        const coreExposedLogs = i18n.t('npc.fourth_boss.battle.maya_exposed', { returnObjects: true }) as string[]
        coreExposedLogs.forEach((_log) => Terminal.log(_log))
      })

      const god2 = monster.makeMonster('fallen_god_2')!

      const god2Unit = battle.toCombatUnit(god2, 'monster')

      const groupUnits = monster
        .makeMonsters('monster-b6-fragment')
        .sort(() => Math.random() - 0.5) // 무작위 섞기
        .slice(0, 2)
        .map((monster) => battle.toCombatUnit(monster, 'monster'))

      return [...groupUnits, god2Unit, amorUnit, mayaUnit]
    }

    // 레지스탕스가 살아있는 분기
    const kane = npcs.getNPC('kane_leader')

    const isKaneAlive = kane?.isAlive
    const resEncounterKey = isKaneAlive
      ? 'npc.fourth_boss.encounter_resistance.kane'
      : 'npc.fourth_boss.encounter_resistance.ren'

    await speak(i18n.t(resEncounterKey, { returnObjects: true }) as string[])

    const _res = await Terminal.confirm(i18n.t('npc.fourth_boss.join_resistance_prompt'))
    if (_res) {
      this.withResistance = true
      return []
    } else {
      const resRefuseKey = isKaneAlive
        ? 'npc.fourth_boss.refuse_resistance_battle.kane'
        : 'npc.fourth_boss.refuse_resistance_battle.ren'

      await speak(i18n.t(resRefuseKey, { returnObjects: true }) as string[])

      const resistanceUnit = [
        npcs.getNPC('kane_leader'),
        npcs.getNPC('ren'),
        npcs.getNPC('flint'),
        npcs.getNPC('jax_seeker'),
      ]
        .filter((npc) => npc?.isAlive)
        .map((npc) => battle.toCombatUnit(npc!, 'npc'))
        .map((unit) => {
          unit.applyBuff({
            id: 'grace',
            type: 'dot',
            atk: 30,
            def: 60,
            dot: -50,
            duration: Infinity,
            isLocked: true,
          })

          return unit
        })

      const god2 = monster.makeMonster('fallen_god_2')!

      const god2Unit = battle.toCombatUnit(god2, 'monster')

      god2Unit.onDeathHooks.push(async () => {
        resistanceUnit.forEach((unit) => unit.removeBuff('grace', true))
      })

      const groupUnits = monster
        .makeMonsters('monster-b6-fragment')
        .sort(() => Math.random() - 0.5) // 무작위 섞기
        .slice(0, 4)
        .map((monster) => battle.toCombatUnit(monster, 'monster'))
      // const boss2 = npcs.getNPC('fallen_god_2')
      return [...groupUnits, god2Unit, resistanceUnit] as CombatUnit[]
    }
  }

  async onVictory(bossNpc: BaseNPC, context: AppContext) {
    const { player, map, npcs, events, battle, world, eventBus } = context

    if (this.withResistance) {
      events.completeEvent('join_resistance_battle')
      const kane = npcs.getNPC('kane_leader')

      const isKaneAlive = kane?.isAlive
      const resJoinKey = isKaneAlive
        ? 'npc.fourth_boss.join_resistance_battle.kane'
        : 'npc.fourth_boss.join_resistance_battle.ren'
      await speak(i18n.t(resJoinKey, { returnObjects: true }) as string[])

      player.restoreAll()
      Terminal.log(i18n.t('npc.fourth_boss.system.recovery_log'))

      const _res = await Terminal.confirm(i18n.t('npc.fourth_boss.system.move_confirm'))

      if (_res) {
        await map.changeScene(MAP_IDS.B1_SUBWAY, context)
      } else {
        const resEndKey = isKaneAlive
          ? 'npc.fourth_boss.wait_resistance_battle.kane'
          : 'npc.fourth_boss.wait_resistance_battle.ren'

        Terminal.log(i18n.t(resEndKey))
      }

      bossNpc && bossNpc.dead({ karma: 0 })

      return
    }

    if (events.isCompleted('caron_is_mine')) {
      await speak(i18n.t('npc.fourth_boss.caron_distrust', { returnObjects: true }) as string[])

      const _res = await Terminal.confirm(i18n.t('npc.fourth_boss.system.move_confirm'))

      if (_res) {
        await speak(i18n.t('npc.fourth_boss.caron_battle_start', { returnObjects: true }) as string[])
        const caron = npcs.getNPC('caron')

        const _isWin = await battle.runCombatLoop([battle.toCombatUnit(caron!, 'npc')], world)

        if (_isWin) {
          if (bossNpc) {
            bossNpc.hp = bossNpc.maxHp
            bossNpc.isAlive = true
          }

          events.completeEvent('caron_is_dead')

          await Ending.run(context)

          await eventBus.emitAsync(GameEventType.SYSTEM_EXIT)
          
          return 'exit'
        }
      } else {
        await speak(i18n.t('npc.fourth_boss.caron_cooperate_after_slaughter', { returnObjects: true }) as string[])

        bossNpc && bossNpc.dead({ karma: 0 })
      }

      return
    }

    //TODO: 사신과의 마지막 싸움만이 남았다..
  }
}
