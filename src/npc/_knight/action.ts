import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { GameEquipAble } from '~/systems/item/GameEquipAble'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { GameContext } from '~/types'
import { speak } from '~/utils'
import { KnightService } from './service'

export const KnightActions = {
  async handleFirst(context: GameContext) {
    const { events } = context
    await speak(i18n.t('npc._knight.first_encounter.lines', { returnObjects: true }) as string[])
    Terminal.log(`\x1b[36m[System] ${i18n.t('npc._knight.first_encounter.system_hint')}\x1b[0m`)
    events.completeEvent('talk_knight')
    return true
  },

  async handleUpgrade(player: Necromancer) {
    if (player.knightUpgrade.length >= player.upgradeLimit) {
      Terminal.log(i18n.t('npc._knight.upgrade.cannot_upgrade'))
      return true
    }

    const choices = KnightService.getUpgradeCandidates(player.inventory)
    choices.push({ name: 'cancel', message: i18n.t('cancel') })

    const selected = await Terminal.select(i18n.t('npc._knight.upgrade.select_title'), choices)
    if (selected === 'cancel') return true

    const proceed = await Terminal.confirm(i18n.t('npc._knight.upgrade.confirm'))
    if (!proceed) {
      Terminal.log(i18n.t('npc._knight.upgrade.cancel'))
      return true
    }

    const targetItem = player.inventory.find((item) => item.id === selected) as GameEquipAble
    if (targetItem) {
      player.knightUpgrade.push(targetItem.rarity || 'COMMON')
      player.removeItem(targetItem.id)
      Terminal.log(i18n.t('npc._knight.upgrade.success'))
    }
    return true
  },

  async handleReset(player: Necromancer) {
    const cost = KnightService.getResetCost(player.knightUpgrade.length)
    const proceed = await Terminal.confirm(i18n.t('npc._knight.upgrade.reset', { cost }))

    if (!proceed) {
      Terminal.log(i18n.t('npc._knight.reset.cancel'))
      return true
    }

    player.knightUpgrade = []
    Terminal.log(i18n.t('npc._knight.reset.success'))
    return true
  },
}
