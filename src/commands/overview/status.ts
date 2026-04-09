import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { CommandFunction, ItemType } from '~/types'

export const statusCommand: CommandFunction = (args, { player }) => {
  const { atk: originAtk, def: originDef, skeleton, maxSkeleton } = player
  const { atk, def, crit, eva, hp, mp, maxHp, maxMp, gold, level, exp, equipped } = player.computed

  Terminal.log(i18n.t('commands.look.status.title'))
  Terminal.log(i18n.t('commands.look.status.level', { level, exp }))

  const { required: expNeeded } = player.expToNextLevel()
  if (expNeeded !== null) {
    Terminal.log(i18n.t('commands.look.status.exp_next', { expNeeded }))
  } else {
    Terminal.log(i18n.t('commands.look.status.max_level'))
  }

  Terminal.log(i18n.t('commands.look.status.hp', { hp, maxHp }))
  Terminal.log(i18n.t('commands.look.status.mp', { mp, maxMp }))
  Terminal.log(i18n.t('commands.look.status.atk', { atk, bonus: atk - originAtk }))
  Terminal.log(i18n.t('commands.look.status.def', { def, bonus: def - originDef }))
  Terminal.log(i18n.t('commands.look.status.gold', { gold: gold.toLocaleString() + 'G' }))

  Terminal.log(i18n.t('commands.look.status.crit', { val: Math.floor(crit * 100) }))
  Terminal.log(i18n.t('commands.look.status.eva', { val: Math.floor(eva * 100) }))

  // 무기 정보 처리
  let weaponText = i18n.t('commands.look.status.equipment.none')
  if (equipped.weapon && equipped.weapon.type === ItemType.WEAPON) {
    weaponText = i18n.t('commands.look.status.equipment.bonus_atk', {
      label: equipped.weapon.name,
      atk: equipped.weapon.atk,
    })

    if ('affix' in equipped.weapon && equipped.weapon.affix) {
      const { name, description } = i18n.t(`affix.${equipped.weapon.affix.id}`, { returnObjects: true }) as {
        name: string
        description: string
      }

      weaponText += i18n.t('commands.look.status.equipment.affix', {
        name,
        description,
      })
    }
  }

  // 방어구 정보 처리
  let armorText = i18n.t('commands.look.status.equipment.none')
  if (equipped.armor && equipped.armor.type === ItemType.ARMOR) {
    armorText = i18n.t('commands.look.status.equipment.bonus_def', {
      label: equipped.armor.name,
      def: equipped.armor.def,
    })

    if ('affix' in equipped.armor && equipped.armor.affix) {
      const { name, description } = i18n.t(`affix.${equipped.armor.affix.id}`, { returnObjects: true }) as {
        name: string
        description: string
      }

      armorText += i18n.t('commands.look.status.equipment.affix', {
        name,
        description,
      })
    }
  }

  Terminal.log(i18n.t('commands.look.status.equipment.weapon', { text: weaponText }))
  Terminal.log(i18n.t('commands.look.status.equipment.armor', { text: armorText }))

  // 소환수 군단 상태
  Terminal.log(i18n.t('commands.look.status.legion.title'))
  if (player.golem) {
    const golemStatus = player.golem.isAlive
      ? i18n.t('commands.look.status.legion.status', { hp: player.golem.hp, maxHp: player.golem.maxHp })
      : i18n.t('commands.look.status.legion.golem_destroyed')

    const golemIcon = player.golem.isAlive ? '🤖' : '🛠️'
    Terminal.log(` └ ${golemIcon} ${player.golem.name}: ${golemStatus}`)
  }

  if (player.knight) {
    const knightStatus = player.knight.isAlive
      ? i18n.t('commands.look.status.legion.status', { hp: player.knight.hp, maxHp: player.knight.maxHp })
      : i18n.t('commands.look.status.legion.knight_dead')

    const knightIcon = player.knight.isAlive ? '⚔️' : '💀'
    Terminal.log(` └ ${knightIcon} ${player.knight.name}: ${knightStatus}`)
  }

  Terminal.log(i18n.t('commands.look.status.legion.skeleton', { count: skeleton.length, max: maxSkeleton }))

  if (player.minions.length === 0) {
    Terminal.log(i18n.t('commands.look.status.legion.no_minions'))
  }
  Terminal.log(i18n.t('commands.look.status.footer'))

  return false
}
