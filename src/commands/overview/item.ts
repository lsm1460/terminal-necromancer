import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import { Item } from '~/core/item/Item'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { Drop } from '~/types/item'
import { getOriginId } from '~/utils'
import { selectTarget } from './utils'

export const printItem = (item: Item, inInventory = false) => {
  const rarityKey = item.rarity || 'COMMON'
  const rarityText = i18n.t(`commands.look.item.rarity.${rarityKey}`)
  const { name, origin } = item

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(` ${rarityText} ${name} ${item.quantity ? `(x${item.quantity})` : ''}`)
  Terminal.log(`──────────────────────────────────────────────`)

  const stats: string[] = []
  
  // 1. 공격 관련 스탯 (공격력이 0보다 클 때만)
  if ('atk' in item && (item.atk || 0) > 0) {
    stats.push(i18n.t('commands.look.item.stats.atk', { val: item.atk }))
    // 치명타는 0%일 수도 있으므로 공격력이 있을 때 세트로 출력하거나, 0보다 클 때만 출력
    if (item.crit && item.crit > 0) {
      stats.push(i18n.t('commands.look.item.stats.crit', { val: (item.crit * 100).toFixed(2) }))
    }
  }

  // 2. 방어/회피 (0보다 클 때만)
  if ('def' in item && (item.def || 0) > 0) {
    stats.push(i18n.t('commands.look.item.stats.def', { val: item.def }))
  }
  if ('eva' in item && item.eva && item.eva > 0) {
    stats.push(i18n.t('commands.look.item.stats.eva', { val: (item.eva * 100).toFixed(2) }))
  }

  if ('hpHeal' in item && item.hpHeal && item.hpHeal > 0) {
    stats.push(i18n.t('commands.look.item.stats.hpHeal', { val: item.hpHeal }))
  }

  if (stats.length > 0) {
    Terminal.log(`${i18n.t('commands.look.item.stats.label')}${stats.join(' | ')}`)
  }

  if ('maxSkeleton' in item && item.maxSkeleton && item.maxSkeleton > 0) {
    Terminal.log(i18n.t('commands.look.item.stats.maxSkeleton', { val: item.maxSkeleton }))
  }

  // 5. 어픽스(특수 효과) 출력
  if ('affix' in item && item.affix?.id) {
    const { name: affixName, description: affixDesc } = i18n.t(`affix.${item.affix.id}`, { returnObjects: true }) as {
      name: string
      description: string
    }

    if (affixName) {
      Terminal.log(
        i18n.t('commands.look.item.stats.affix', {
          name: affixName,
          description: affixDesc,
        })
      )
    }
  }

  const originId = getOriginId(item.id)

  Terminal.log(`──────────────────────────────────────────────`)
  Terminal.log(` 📝 ${i18n.t(`item.${originId}.description`)}`)
  
  // 가격 정보 (0원이어도 출력할지, 0보다 클 때만 출력할지 선택 가능)
  if (item.price !== undefined || item.sellPrice !== undefined) {
    Terminal.log(
      i18n.t('commands.look.item.info.price', {
        price: item.price || 0,
        sellPrice: item.sellPrice || 0,
      })
    )
  }
  
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  if (!inInventory) {
    Terminal.pick(origin, `\n${i18n.t('commands.pick_up', {item: name})}`)
  }
}

export const lookItem = async (dropList: Drop[], player: Player) => {
  const items = _.chain(dropList)
    .groupBy((item) => item.origin)
    .map((group, label) => ({
      label,
      qty: _.sumBy(group, (i) => i.quantity || 1),
      raw: group[0],
    }))
    .value()

  const subChoices = items.map((i) => ({
    name: i.label,
    message: Item.makeItemMessage(i.raw, player),
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = items.find((i) => i.label === selected)
    if (target) printItem(target.raw)
  }

  return selected
}
