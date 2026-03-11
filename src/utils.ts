import { nanoid } from 'nanoid'
import { Terminal } from './core/Terminal'
import { Player } from './core/player/Player'
import i18n from './i18n'
import { Item, ItemType } from './types'
import { RARITY_SETTINGS } from './core/item/consts'

export function generateId(baseId?: string, length = 8): string {
  const uniqueHash = nanoid(length)
  return baseId ? `${baseId}::${uniqueHash}` : uniqueHash
}

export function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function delay(amount: number = 1500) {
  await new Promise((resolve) => setTimeout(resolve, amount))
}

export function getItemLabel(item: Item) {
  const originId = item.id.split('::')[0]
  const label = i18n.t(`item.${originId}.label`)

  const finalLabel = []

  if (item.rarity) {
    const setting = RARITY_SETTINGS[item.rarity]

    finalLabel.push(setting.color)
    finalLabel.push(setting.symbol)
  }

  if ('affix' in item && item.affix) {
    const affixName = i18n.t(`affix.${item.affix.id}.name`)

    finalLabel.push(`[${affixName}]`)
  }

  if ('adjective' in item && item.adjective) {
    finalLabel.push(i18n.t(`item_prefix.${item.adjective}`))
  }

  if ('perfPrefix' in item && item.perfPrefix) {
    finalLabel.push(i18n.t(`item_prefix.${item.perfPrefix}`))
  }

  finalLabel.push(label)
  finalLabel.push('\x1b[0m')

  return finalLabel.join(' ').replace(/\s+/g, ' ').trim()
}

export function makeItemMessage(item: Item, player: Player, options?: { withPrice?: boolean; isSell?: boolean }) {
  const typeMap: Partial<Record<ItemType, string>> = {
    weapon: '무기',
    armor: '방어구',
    food: '음식',
  }

  const typeLabel = typeMap[item.type] || '아이템'

  let message = `[${typeLabel}] ${getItemLabel(item)}${item.quantity ? ` (${item.quantity}개)` : ''}`

  if (options?.withPrice) {
    const displayPrice = options.isSell ? (item.sellPrice ?? 0) : item.price

    message += ` (${displayPrice}gold)`
  }

  if (item.type === 'weapon') {
    const currentAtk = player.equipped.weapon?.atk || 0
    const diff = item.atk - currentAtk
    const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-'
    message += ` [공격력: ${currentAtk} → ${item.atk} (${sign}${Math.abs(diff)})]`
  } else if (item.type === 'armor') {
    const currentDef = player.equipped.armor?.def || 0
    const diff = item.def - currentDef
    const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-'
    message += ` [방어력: ${currentDef} → ${item.def} (${sign}${Math.abs(diff)})]`
  }

  return message
}

export async function speak(messages: string[]) {
  for (const message of messages) {
    await Terminal.prompt(message)
  }
}

export const getHpColor = (hpPercentage: number) => {
  if (hpPercentage > 50) return '#4caf50'
  if (hpPercentage > 20) return '#ffeb3b'
  return '#f44336'
}
