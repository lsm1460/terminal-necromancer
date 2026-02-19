import { CombatUnit } from '../../../core/battle/CombatUnit'
import { Player } from '../../../core/Player'
import { GameContext, GameEvent, NPC } from '../../../types'
import { BossLogic } from './BossLogic'

export class SecondBoss implements BossLogic {
  createEnemies(bossNpc: NPC, eventData: GameEvent, context: GameContext): CombatUnit[] {
    const { battle, monster } = context

    // 1. 메인 보스 추가
    const core = monster.makeMonster('golem_core')
    const coreUnit = battle.toCombatUnit(core!, 'monster')
    coreUnit.applyBuff({
      name: '은신',
      type: 'stealth',
      duration: Infinity,
      isLocked: true
    })

    const enemies: CombatUnit[] = [coreUnit]

    // 2. 동반 몬스터가 있다면 추가
    if (eventData.withMonster) {
      const additional = monster.makeMonsters(eventData.withMonster).map((m) => battle.toCombatUnit(m, 'monster'))
      enemies.push(...additional)
    }

    const amor = monster.makeMonster('golem_chest_armor')
    const amorUnit = battle.toCombatUnit(amor!, 'monster')

    amorUnit.onBeforeHitHooks.push(async (attacker, defender, options) => {
      if (options.attackType !== 'explode') {
        options.rawDamage = 1 // 대미지를 1로 고정

        console.log(
          `\n🛡️ [장갑] 견고한 장갑판이 공격을 튕겨냅니다!\n(장갑의 틈새를 공략할 강력한 '폭발'이 필요할 것 같습니다...)`
        )
      } else {
        options.skillAtkMult = 2
      }
    })

    amorUnit.onDeathHooks.push(async () => {
      // 1. 은신 버프 제거
      coreUnit.removeBuff('은신', true)

      // 2. 연출 로그 출력
      console.log(`\n━━━━━━━━━━━━━━━ ⚠️  CORE EXPOSED ━━━━━━━━━━━━━━━`)
      console.log(`💥 콰아앙! 견고했던 가슴 장갑판이 완전히 산산조각납니다!`)
      console.log(`🔍 안개처럼 자욱했던 [은신] 장치가 과부하로 멈추며,`)
      console.log(`✨ 보스의 중심부에서 빛나는 [기계 코어]가 모습을 드러냅니다!`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    })

    enemies.push(amorUnit)

    return enemies
  }

  async onVictory(player: Player, context: GameContext) {
    const {npcs} = context

    const boss = npcs.getNPC('second_boss')

    boss && boss.dead(0)
  }
}
