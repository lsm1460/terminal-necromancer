import { EventBus } from '~/core/EventBus'
import { Terminal } from '~/core'
import { GameEventType, SkillEffectResult } from '~/core/types'
import i18n from '~/i18n'

export class SkillEffectPresenter {
  constructor(private eventBus: EventBus) {
    this.eventBus.subscribe(GameEventType.SKILL_EFFECT_LOG, this.logEffect)
  }

  private logEffect = (result: SkillEffectResult) => {
    const { type, targetName, attackerName, payload, skillId } = result
    const skillName = i18n.t(`skill.npc.${skillId}.name`)
    const description = i18n.t(`skill.npc.${skillId}.description`)

    switch (type) {
      case 'execute':
        Terminal.log(
          i18n.t('skill.execution', {
            attacker: attackerName,
            skill: skillName,
          })
        )
        Terminal.log(`💬 ${description}`)
        break
      case 'not_found':
        Terminal.log(i18n.t('skill.target_not_found'))
        break
      case 'heal':
        Terminal.log(
          i18n.t('skill.effect.heal', {
            target: targetName,
            amount: payload.amount,
          })
        )
        break

      case 'summon_success':
        const key = payload.isDivide ? 'skill.effect.summon.divide' : 'skill.effect.summon.call'

        Terminal.log(
          i18n.t(key, {
            attacker: attackerName,
            reinforcement: payload.reinforcementName,
          })
        )
        break

      case 'summon_fail':
        Terminal.log(
          i18n.t('skill.effect.summon.fail', {
            attacker: attackerName,
          })
        )
        break

      default:
        // console.warn(`[SkillEffectPresenter] 알 수 없는 효과 타입: ${type}`)
        break
    }
  }

  public destroy() {
    this.eventBus.unsubscribe(GameEventType.SKILL_EFFECT_LOG, this.logEffect)
  }
}
