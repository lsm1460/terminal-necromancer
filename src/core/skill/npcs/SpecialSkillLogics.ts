import sample from 'lodash/sample'
import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { BattleTarget, GameContext, ItemType, NpcSkill } from '~/types'

const HIGHLIGHT = (text: string) => `\x1b[33m${text}\x1b[0m`

export const SpecialSkillLogics: Record<
  string,
  (attacker: CombatUnit, targets: CombatUnit[], skill: NpcSkill, context: GameContext) => Promise<void>
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
                item: targetItem.name,
              })
            )
          )
        }
      } else {
        Terminal.log(i18n.t('skill.special.item_steal.fail', { attacker: attacker.name }))
      }
    }
  },

  purify_essence: async (attacker, targets, skill) => {
    Terminal.log(i18n.t('skill.special.purify_essence', { attacker: attacker.name }))

    for (const target of targets) target.removeRandomDeBuff()
  },
  shadow_bind: async (attacker, targets, skill, context) => {
    const { battle } = context

    const _targets = targets
      .filter((unit) => !unit.deBuff.some((deBuff) => deBuff.id === 'bind'))
      .sort((a, b) => b.ref.atk - a.ref.atk)
      .slice(0, 3)

    if (_targets.length === 0) return

    _targets.forEach((unit) => {
      unit.applyDeBuff({ id: 'bind', type: 'bind', duration: Infinity })
    })

    const watcher = battle._spawnMonster('watcher', context)!

    watcher.onProcessHitHooks.push(async (attacker, defender, options) => {
      if ((attacker.ref as BattleTarget).isMinion) {
        options.rawDamage = 0 // 대미지 무효화

        Terminal.log('미니언은 때릴 수 없음')
      }
    })

    watcher.onDeathHooks.push(async () => {
      _targets.forEach((unit) => unit.removeDeBuff('bind'))
    })
  },
}
