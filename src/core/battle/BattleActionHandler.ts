import { BattleTarget, GameContext } from '~/types'
import { Terminal } from '../Terminal'
import { Player } from '../player/Player'
import { SkillManager } from '../skill'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { AffixManager } from './AffixManager'
import { CombatUnit } from './unit/CombatUnit'
import { TargetSelector } from './TargetSelector'
import { BattleUnitManager } from './BattleUnitManager'
import { BattleDirector } from './BattleDirector'

export class BattleActionHandler {
  constructor(
    private player: Player,
    private unitManager: BattleUnitManager,
    private npcSkills: NpcSkillManager
  ) {}

  async handleUnitDeBuff(unit: CombatUnit): Promise<boolean> {
    const dotEffects = unit.deBuff.filter((d) => d.type === 'dot')
    for (const effect of dotEffects) {
      const damage = Math.max(1, effect.atk || 0)
      unit.ref.hp -= damage
      Terminal.log(` └ 🩸 [${effect.name}] 피해: -${damage} (남은 지속: ${effect.duration}턴)`)

      if (unit.ref.hp <= 0) {
        Terminal.log(` └ 💀 ${unit.name}이(가) ${effect.name}으로 사망했습니다.`)
        await unit.dead()
        return true
      }
    }

    const bindEffect = unit.deBuff.find((d) => d.type === 'bind')
    if (bindEffect) {
      Terminal.log(
        `\n⛓️  ${unit.name}은(는) ${bindEffect.name}(으)로 인해 움직일 수 없습니다! (남은 기간: ${bindEffect.duration}턴)`
      )
      return true
    }

    return false
  }

  async handlePlayerAction(
    playerUnit: CombatUnit<Player>,
    playerSide: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    const action = await Terminal.select(
      '당신의 행동을 선택하세요:',
      ['상태', '공격', '방어', '스킬', '아이템', '도망'].map((v) => ({ name: v, message: v }))
    )

    switch (action) {
      case '상태':
        await this.showBattleStatus(playerSide)
        return await this.handlePlayerAction(playerUnit, playerSide, context)

      case '공격':
        if (!(await this.handlePlayerAttackAction(playerUnit, playerSide, context))) {
          return await this.handlePlayerAction(playerUnit, playerSide, context)
        }
        break

      case '방어':
        this.handleGuardAction(playerUnit)
        break

      case '스킬':
        if (!(await this.handlePlayerSkillAction(playerUnit, playerSide, context))) {
          return await this.handlePlayerAction(playerUnit, playerSide, context)
        }
        break

      case '아이템':
        if (!(await this.handlePlayerItemAction(playerUnit, playerSide, context))) {
          return await this.handlePlayerAction(playerUnit, playerSide, context)
        }
        break

      case '도망':
        return await this.handlePlayerEscapeAction()

      default:
        break
    }
    return false
  }

  private async showBattleStatus(playerSide: CombatUnit[]) {
    Terminal.log('\n━━━━━━━━━━━━━━━━━━━━ 전장 상황 ━━━━━━━━━━━━━━━━━━━━')
    Terminal.log(' [🛡️ 아군 진영]')
    playerSide.forEach((unit, i) => Terminal.log(this.renderUnitLine(unit, i === 0)))
    Terminal.log('──────────────────────────────────────────────────')
    Terminal.log(' [⚔️ 적군 진영]')
    this.unitManager.getAliveEnemies().forEach((unit, i) => Terminal.log(this.renderUnitLine(unit, i === 0)))
    Terminal.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }

  private renderUnitLine(unit: CombatUnit, isLead: boolean): string {
    const leadLabel = isLead ? '🚩 [선두]' : '         '
    let line = `${leadLabel} ${unit.name} (${unit.ref.hp}/${unit.ref.maxHp})`
    const buffText = unit.buff.map((b) => `\x1b[32m[${b.name}:${b.duration}턴]\x1b[0m`).join(' ')
    const deBuffText = unit.deBuff.map((d) => `\x1b[31m[${d.name}:${d.duration}턴]\x1b[0m`).join(' ')
    if (buffText || deBuffText) {
      line += `\n         └─ 상태: ${buffText} ${deBuffText}`.trimEnd()
    }
    return line
  }

  private async handlePlayerAttackAction(
    playerUnit: CombatUnit<Player>,
    playerSide: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    const enemies = this.unitManager.getAliveEnemies()
    const { choices } = new TargetSelector(enemies).excludeStealth().build()
    const targetId = await Terminal.select('누구를 공격하시겠습니까?', [
      ...choices,
      { name: 'cancel', message: '🔙 뒤로가기' },
    ])

    if (targetId === 'cancel') return false

    const target = enemies.find((e) => e.id === targetId)
    if (target) {
      BattleDirector.playAttack(playerUnit.id)

      await target.executeHit(playerUnit, { attackType: playerUnit.attackType })
      return true
    }
    return false
  }

  private handleGuardAction(playerUnit: CombatUnit<Player>) {
    Terminal.log(`🛡️ ${playerUnit.name}(이)가 방어 자세를 취합니다! 다음 턴까지 피해를 덜 입습니다.`)
    playerUnit.applyBuff({ name: '방어', type: 'buff', def: 10, duration: 2 })
  }

  private async handlePlayerSkillAction(
    playerUnit: CombatUnit<Player>,
    playerSide: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    const ally = playerSide.filter((unit) => unit.type !== 'player')
    const { skillId, isSuccess } = await SkillManager.requestAndExecuteSkill(playerUnit, context, {
      ally,
      enemies: this.unitManager.getAliveEnemies(),
    })

    if (isSuccess) {
      await this.unitManager.refreshPlayerSide()

      BattleDirector.updateUnits({ playerSide: this.unitManager.getPlayerSide() })
      BattleDirector.playAttack(playerUnit.id)
    }

    return isSuccess
  }

  private async handlePlayerItemAction(
    playerUnit: CombatUnit<Player>,
    playerSide: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    return await playerUnit.ref.useItem()
  }

  private async handlePlayerEscapeAction(): Promise<boolean> {
    const blocker = this.unitManager.getAliveEnemies().find((e) => (e.ref as BattleTarget).noEscape === true)
    if (blocker) {
      Terminal.log(`\n🚫 도망칠 수 없습니다! ${blocker.name}(이)가 길을 가로막고 있습니다!`)
      return false
    }
    Terminal.log('\n🏃 전투에서 도망쳤습니다!')
    this.unitManager.clear()
    return true
  }

  async executeAutoAttack(
    attacker: CombatUnit,
    targets: CombatUnit<BattleTarget>[],
    ally: CombatUnit[],
    context: GameContext
  ) {
    const visibleTargets = targets.filter((t) => !t.isStealth)
    if (visibleTargets.length === 0) {
      Terminal.log(` > ${attacker.name}(이)가 공격할 대상을 찾지 못해 두리번거립니다...`)
      return
    }

    const autoSkill = this.npcSkills.getRandomSkill(attacker)
    if (autoSkill) {
      await this.npcSkills.execute(autoSkill.id, attacker, ally, visibleTargets, context)
    } else {
      let target: CombatUnit
      if (['monster', 'npc'].includes(attacker.type)) {
        target = AffixManager.handleBeforeAttack(this.player, attacker, visibleTargets)
      } else {
        target = [...visibleTargets].sort((a, b) => {
          const aHasFocus = a.deBuff.some((b) => b.type === 'focus') ? 1 : 0
          const bHasFocus = b.deBuff.some((b) => b.type === 'focus') ? 1 : 0
          return bHasFocus - aHasFocus
        })[0] as CombatUnit
      }

      if (attacker.stats.atk > 0) {
        BattleDirector.playAttack(attacker.id)

        await target.executeHit(attacker, { attackType: attacker.attackType })
      } else {
        Terminal.log(`${attacker.name}은 가만히 서있을 뿐이다.`)
      }
    }
    autoSkill?.buff?.type !== 'stealth' && attacker.removeStealth()
  }
}
