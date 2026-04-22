import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { GameContext, Tile } from '~/core/types'
import i18n from '~/i18n'
import { speak } from '~/utils'
import { Necromancer } from '../job/necromancer/Necromancer'
import { BossFactory } from './boss/BossFactory'

class BossEvent {
  static async handle(context: GameContext) {
    const { npcs, events, battle, world, currentTile: tile } = context

    // 1. 타일 정보에서 보스 NPC 아이디 추출
    const bossId = tile.npcIds?.[0]
    if (!bossId) return

    const bossNpc = npcs.getNPC(bossId)!

    // 이미 클리어했거나 보스가 죽은 상태라면 포탈 생성 후 종료
    if (events.isCompleted(bossId) || !bossNpc || !bossNpc.isAlive) {
      this.spawnPortal(tile)
      return
    }

    const bossLogic = BossFactory.getLogic(bossId)

    this.printEncounterHeader(bossNpc.name)

    const encounterTalk =
      bossLogic?.postTalk || (i18n.t('events.boss.encounter.default_talk', { returnObjects: true }) as string[])
    await speak(encounterTalk)

    Terminal.log(i18n.t('events.boss.encounter.start_battle'))

    let enemies: CombatUnit[] = []
    if (bossLogic) {
      enemies = await bossLogic.createEnemies(bossNpc, context)
    } else {
      enemies = [battle.toCombatUnit(bossNpc, 'npc')]
    }

    const isWin = enemies.length > 0 ? await battle.runCombatLoop(enemies, world) : true

    tile.isClear = isWin

    if (isWin) {
      bossNpc.hp = 0
      bossNpc.isAlive = false

      
      if (bossLogic?.onVictory) {
        const _res = await bossLogic.onVictory(bossNpc, context)

        if (_res === 'exit') {
          return
        }
      }

      events.completeEvent(bossId)

      this.spawnPortal(tile)

      // 전투 후 마무리 대화
      if (bossLogic?.defeatTalk) {
        await speak(bossLogic.defeatTalk)
      }
    }
  }

  /**
   * 보스 등장 헤더 출력
   */
  private static printEncounterHeader(name: string) {
    Terminal.log(`\n━━━━━ BOSS ENCOUNTER ━━━━━`)
    Terminal.log(i18n.t('events.boss.encounter.blocking', { name }))
    Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * 클리어 후 차원문 타일 추가
   */
  static spawnPortal(tile: Tile) {
    tile.npcIds = _.uniq([...(tile.npcIds || []), 'portal'])
    Terminal.log(i18n.t('events.boss.portal.spawn'))
  }
}

export default BossEvent
