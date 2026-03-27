import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { Drop, Item } from '~/types'
import { getItemLabel, getOriginId, makeItemMessage } from '~/utils'
import { selectTarget } from './utils'

export const printItem = (item?: Item) => {
  if (!item) {
    Terminal.log(i18n.t('item_not_found'))
    return
  }

  const rarityKey = item.rarity || 'COMMON'
  const rarityText = i18n.t(`commands.look.item.rarity.${rarityKey}`)
  const { label, origin } = getItemLabel(item)

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(` ${rarityText} ${label} ${item.quantity ? `(x${item.quantity})` : ''}`)
  Terminal.log(`──────────────────────────────────────────────`)

  const stats: string[] = []
  if ('atk' in item) {
    stats.push(i18n.t('commands.look.item.stats.atk', { val: item.atk }))
    stats.push(i18n.t('commands.look.item.stats.crit', { val: (item.crit * 100).toFixed(2) }))
  }
  if ('def' in item) stats.push(i18n.t('commands.look.item.stats.def', { val: item.def }))
  if ('eva' in item && item.eva)
    stats.push(i18n.t('commands.look.item.stats.eva', { val: (item.eva * 100).toFixed(2) }))
  if ('hpHeal' in item) stats.push(i18n.t('commands.look.item.stats.hpHeal', { val: item.hpHeal }))

  if (stats.length > 0) Terminal.log(`${i18n.t('commands.look.item.stats.label')}${stats.join(' | ')}`)

  if ('mana' in item && item.mana) Terminal.log(i18n.t('commands.look.item.stats.mana', { val: item.mana }))
  if ('maxSkeleton' in item && item.maxSkeleton)
    Terminal.log(i18n.t('commands.look.item.stats.maxSkeleton', { val: item.maxSkeleton }))

  if ('affix' in item && item.affix) {
    const { name, description } = i18n.t(`affix.${item.affix.id}`, { returnObjects: true }) as {
      name: string
      description: string
    }

    Terminal.log(
      i18n.t('commands.look.item.stats.affix', {
        name,
        description,
      })
    )
  }

  const originId = getOriginId(item.id)

  Terminal.log(`──────────────────────────────────────────────`)
  Terminal.log(` 📝 ${i18n.t(`item.${originId}.description`)}`)
  Terminal.log(
    i18n.t('commands.look.item.info.price', {
      price: item.price,
      sellPrice: item.sellPrice,
    })
  )
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  Terminal.pick(origin)
}

export const lookItem = async (dropList: Drop[], player: Player) => {
  const items = _.chain(dropList)
    .groupBy((item) => getItemLabel(item).origin)
    .map((group, label) => ({
      label,
      qty: _.sumBy(group, (i) => i.quantity || 1),
      raw: group[0],
    }))
    .value()

  const subChoices = items.map((i) => ({
    name: i.label,
    message: makeItemMessage(i.raw, player),
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = items.find((i) => i.label === selected)
    if (target) printItem(target.raw)
  }

  return selected
}
