import { Terminal } from '~/core'
import { Item } from '~/core/item/Item'
import { Drop } from '~/core/types'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { GameEquipAble } from '~/systems/item/GameEquipAble'
import { GameItem } from '~/systems/item/GameItem'
import { selectTarget } from './utils'

export const printItem = (_item: Item, inInventory = false) => {
  const item = _item as GameItem

  const rarityKey = item.rarity || 'COMMON'
  const rarityText = i18n.t(`commands.look.item.rarity.${rarityKey}`)
  const { name, origin, description } = item // 이제 description도 item에서 가져올 수 있음

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(` ${rarityText} ${name} ${item.quantity ? `(x${item.quantity})` : ''}`)
  Terminal.log(`──────────────────────────────────────────────`)

  if (item.infoTags.length > 0) {
    Terminal.log(`${i18n.t('commands.look.item.stats.label')}${item.infoTags.join(' | ')}`)
  }

  if (item instanceof GameEquipAble) {
    // 3. 특수 정보 (소환수 등) - 필요시 전용 인터페이스 확인
    if (item?.maxSkeleton || 0 > 0) {
      Terminal.log(i18n.t('commands.look.item.stats.maxSkeleton', { val: item.maxSkeleton }))
    }

    if (item?.minRebornRarity || 0 > 0) {
      Terminal.log(i18n.t('commands.look.item.stats.minRebornRarity', { val: item.maxSkeleton }))
    }

    // 4. 어픽스(특수 효과) 출력 - 인터페이스나 클래스 메서드로 캡슐화 권장
    if (item.affix) {
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
  }

  Terminal.log(`──────────────────────────────────────────────`)
  Terminal.log(` 📝 ${description}`) // 이제 item.description이 내부적으로 i18n 처리를 담당

  // 5. 가격 정보
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
    Terminal.pick(origin, `\n${i18n.t('commands.pick_up', { item: name })}`)
  }
}

export const lookItem = async (dropList: Drop[], player: Player) => {
  const subChoices = dropList.map((i) => ({
    name: i.id,
    message: i.makeItemMessage(player),
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = dropList.find((i) => i.id === selected)
    if (target) printItem(target)
  }

  return selected
}
