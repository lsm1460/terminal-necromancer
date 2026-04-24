import { EventBus } from '~/core/EventBus'
import i18n from '~/i18n'
import { Battle, BattleTarget } from '.'
import { Terminal } from '../Terminal'
import { World } from '../World'
import { Player } from '../player/Player'
import { SkillManager } from '../skill/SkillManager'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { BattleDirector } from './BattleDirector'
import { BattleUnitManager } from './BattleUnitManager'
import { TargetSelector } from './TargetSelector'
import { CombatUnit } from './unit/CombatUnit'

export class BattleActionHandler {
  constructor(
    private eventBus: EventBus,
    private world: World,
    private unitManager: BattleUnitManager,
    private npcSkills?: NpcSkillManager
  ) {}

  async handleUnitDeBuff(unit: CombatUnit): Promise<boolean> {
    const dotEffects = [...unit.buff, ...unit.deBuff].filter((d) => (d.dot || 0) > 0)
    for (const effect of dotEffects) {
      const damage = effect.dot || 0
      unit.ref.hp -= damage
      Terminal.log(i18n.t('battle.action.dot_damage', { effectName: effect.name, damage, duration: effect.duration }))

      if (unit.ref.hp <= 0) {
        Terminal.log(i18n.t('battle.action.dot_death', { unitName: unit.name, effectName: effect.name }))
        await unit.dead()
        return true
      }
    }

    const bindEffect = unit.deBuff.find((d) => d.type === 'bind')
    if (bindEffect) {
      Terminal.log(
        i18n.t('battle.action.bind_status', {
          unitName: unit.name,
          effectName: bindEffect.name,
          duration: bindEffect.duration,
        })
      )
      return true
    }

    return false
  }

  async handlePlayerAction(playerUnit: CombatUnit<Player>, playerSide: CombatUnit[]): Promise<boolean> {
    const menu = ['status', 'attack', 'defense', 'skill', 'item', 'escape']
    const choices = menu.map((key) => ({
      name: key,
      message: i18n.t(`battle.action.menu.${key}`),
    }))

    const action = await Terminal.select(i18n.t('battle.action.select_action'), choices)

    switch (action) {
      case 'status':
        await this.showBattleStatus(playerSide)
        return await this.handlePlayerAction(playerUnit, playerSide)
      case 'attack':
        if (!(await this.handlePlayerAttackAction(playerUnit))) {
          return await this.handlePlayerAction(playerUnit, playerSide)
        }
        break
      case 'defense':
        this.handleGuardAction(playerUnit)
        break
      case 'skill':
        if (!(await this.handlePlayerSkillAction(playerUnit, playerSide, this.world))) {
          return await this.handlePlayerAction(playerUnit, playerSide)
        }
        break
      case 'item':
        if (!(await this.handlePlayerItemAction(playerUnit))) {
          return await this.handlePlayerAction(playerUnit, playerSide)
        }
        break
      case 'escape':
        return await this.handlePlayerEscapeAction()
    }
    return false
  }

  private async showBattleStatus(playerSide: CombatUnit[]) {
    Terminal.log(i18n.t('battle.action.status_board.title'))
    Terminal.log(i18n.t('battle.action.status_board.ally_side'))
    playerSide.forEach((unit, i) => Terminal.log(this.renderUnitLine(unit, i === 0)))
    Terminal.log(i18n.t('battle.action.status_board.divider'))
    Terminal.log(i18n.t('battle.action.status_board.enemy_side'))
    this.unitManager.getAliveEnemies().forEach((unit, i) => Terminal.log(this.renderUnitLine(unit, i === 0)))
    Terminal.log(i18n.t('battle.action.status_board.footer'))
  }

  private renderUnitLine(unit: CombatUnit, isLead: boolean): string {
    const leadLabel = isLead ? i18n.t('battle.action.status_board.lead') : '         '
    let line = `${leadLabel} ${unit.name} (${unit.ref.hp}/${unit.ref.maxHp})`
    const buffText = unit.buff.map((b) => `\x1b[32m[${b.name}:${b.duration} Turn]\x1b[0m`).join(' ')
    const deBuffText = unit.deBuff.map((d) => `\x1b[31m[${d.name}:${d.duration} Turn]\x1b[0m`).join(' ')

    if (buffText || deBuffText) {
      const statusLine = `${buffText} ${deBuffText}`.trim()
      line += i18n.t('battle.action.status_board.condition', { status: statusLine })
    }
    return line
  }

  private async handlePlayerAttackAction(playerUnit: CombatUnit<Player>): Promise<boolean> {
    const enemies = this.unitManager.getAliveEnemies()
    const { choices } = new TargetSelector(enemies).excludeStealth().build()
    const targetId = await Terminal.select(i18n.t('battle.action.target_prompt'), [
      ...choices,
      { name: 'cancel', message: i18n.t('cancel') },
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
    Terminal.log(i18n.t('battle.action.guard', { name: playerUnit.name }))
    playerUnit.applyBuff({
      id: 'defense',
      type: 'buff',
      def: 10,
      duration: 2,
    })
  }

  private async handlePlayerSkillAction(
    playerUnit: CombatUnit<Player>,
    playerSide: CombatUnit[],
    world: World
  ): Promise<boolean> {
    const ally = playerSide.filter((unit) => unit.type !== 'player')
    const { skillId, isSuccess } = await SkillManager.requestAndExecuteSkill(
      playerUnit,
      { world: this.world, eventBus: this.eventBus },
      {
        ally,
        enemies: this.unitManager.getAliveEnemies(),
      }
    )

    if (isSuccess) {
      await this.unitManager.refreshPlayerSide()

      BattleDirector.updateUnits({ playerSide: this.unitManager.getPlayerSide() })
      BattleDirector.playAttack(playerUnit.id)
    }

    return isSuccess
  }

  private async handlePlayerItemAction(playerUnit: CombatUnit<Player>): Promise<boolean> {
    return await playerUnit.ref.useItem()
  }

  private async handlePlayerEscapeAction(): Promise<boolean> {
    const blocker = this.unitManager.getAliveEnemies().find((e) => (e.ref as BattleTarget).noEscape === true)
    if (blocker) {
      Terminal.log(i18n.t('battle.action.escape_blocked', { name: blocker.name }))
      return false
    }
    Terminal.log(i18n.t('battle.action.escape_success'))
    this.unitManager.clear()
    return true
  }

  async executeAutoAttack(
    attacker: CombatUnit,
    targets: CombatUnit[],
    ally: CombatUnit[],
    battle: Battle
  ) {
    const visibleTargets = targets.filter((t) => !t.isStealth)
    if (visibleTargets.length === 0) {
      Terminal.log(i18n.t('battle.action.no_target', { name: attacker.name }))
      return
    }

    const usedSkill = await this.tryExecuteNpcSkill(attacker, ally, visibleTargets, battle)

    if (!usedSkill) {
      await this.executeBasicAttack(attacker, visibleTargets)
    }

    if (usedSkill?.buff?.type !== 'stealth') {
      attacker.removeStealth()
    }
  }

  private async tryExecuteNpcSkill(
    attacker: CombatUnit,
    ally: CombatUnit[],
    targets: CombatUnit[],
    battle: Battle
  ) {
    if (!this.npcSkills) return null

    const skill = this.npcSkills.getRandomSkill(attacker)
    if (skill) {
      await this.npcSkills.execute(skill.id, attacker, ally, targets, battle)
      return skill
    }
    return null
  }

  private async executeBasicAttack(attacker: CombatUnit, targets: CombatUnit[]) {
    if (attacker.stats.atk <= 0) {
      Terminal.log(i18n.t('battle.action.idle', { name: attacker.name }))
      return
    }

    const target = this.selectBestTarget(attacker, targets)
    BattleDirector.playAttack(attacker.id)
    await target.executeHit(attacker, { attackType: attacker.attackType })
  }

  private selectBestTarget(attacker: CombatUnit, targets: CombatUnit[]): CombatUnit {
    if (['monster', 'npc'].includes(attacker.type)) {
      return targets[0]
    }

    return [...targets].sort((a, b) => {
      const aHasFocus = a.deBuff.some((b) => b.type === 'focus') ? 1 : 0
      const bHasFocus = b.deBuff.some((b) => b.type === 'focus') ? 1 : 0
      return bHasFocus - aHasFocus
    })[0]
  }
}
