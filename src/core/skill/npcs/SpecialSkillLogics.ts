import sample from 'lodash/sample'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { ItemType, NpcSkill } from '~/types'
import { getItemLabel } from '~/utils'

const HIGHLIGHT = (text: string) => `\x1b[33m${text}\x1b[0m`

export const SpecialSkillLogics: Record<
  string,
  (attacker: CombatUnit, targets: CombatUnit[], skill: NpcSkill) => Promise<void>
> = {
  // 자폭
  self_destruct: async (attacker, targets, skill) => {
    for (const target of targets) {
      await target.executeHit(attacker, {
        attackType: 'explode',
        rawDamage: Math.floor(attacker.ref.maxHp * skill.power),
      })
    }
    Terminal.log(i18n.t('skill.special.self_destruct', { attacker: attacker.name }))
    attacker.dead()
  },

  health_drain: async (attacker, targets, skill) => {
    let totalDamageDealt = 0
    for (const target of targets) {
      const result = await target.executeHit(attacker, {
        skillAtkMult: skill.power,
        attackType: skill.attackType,
      })
      totalDamageDealt += result.damage || 0
    }

    const healAmount = Math.ceil(totalDamageDealt * 0.5)
    if (healAmount > 0) {
      attacker.ref.hp = Math.min(attacker.ref.maxHp, attacker.ref.hp + healAmount)
      Terminal.log(
        i18n.t('skill.special.health_drain', {
          attacker: attacker.name,
          amount: healAmount,
        })
      )
    }
  },

  item_steal: async (attacker, targets, skill) => {
    for (const target of targets) {
      await target.executeHit(attacker, {
        skillAtkMult: skill.power,
        attackType: skill.attackType,
      })

      if (target.type !== 'player') {
        Terminal.log(i18n.t('skill.special.item_steal.no_target', { target: target.name }))
        continue
      }

      const player = target.ref as Player
      const isGoldSteal = Math.random() < 0.5
      const stealableCandidates = player.inventory.filter((item) => item.type !== ItemType.QUEST) || []

      if (isGoldSteal && player.gold > 0) {
        const stealAmount = Math.min(player.gold, Math.floor(10 + player.gold * 0.05))
        player.gold -= stealAmount
        Terminal.log(
          HIGHLIGHT(
            i18n.t('skill.special.item_steal.gold', {
              attacker: attacker.name,
              amount: stealAmount,
            })
          )
        )
      } else if (stealableCandidates.length > 0) {
        const targetItem = sample(stealableCandidates)
        if (targetItem && player.removeItem(targetItem.id, 1)) {
          Terminal.log(
            HIGHLIGHT(
              i18n.t('skill.special.item_steal.item', {
                attacker: attacker.name,
                item: getItemLabel(targetItem),
              })
            )
          )
        }
      } else {
        Terminal.log(i18n.t('skill.special.item_steal.fail', { attacker: attacker.name }))
      }
    }
  },
}
