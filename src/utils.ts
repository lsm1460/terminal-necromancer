import { nanoid } from 'nanoid'
import { Terminal } from './core/Terminal'
import { RARITY_SETTINGS } from './core/item/consts'
import { Player } from './core/player/Player'
import i18n from './i18n'
import { Item, ItemType } from './types'

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
    //TODO: rarity label?
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
  const typeLabel = i18n.t(`item.type.${item.type}`, { defaultValue: i18n.t('item.type.default') });

  let message = `[${typeLabel}] ${getItemLabel(item)}${item.quantity ? ` (x ${item.quantity})` : ''}`;

  if (options?.withPrice) {
    const displayPrice = options.isSell ? (item.sellPrice ?? 0) : item.price;
    message += ` (${displayPrice}gold)`;
  }

  if (item.type === ItemType.WEAPON || item.type === ItemType.ARMOR) {
    const isWeapon = item.type === ItemType.WEAPON;
    const currentVal = isWeapon ? (player.equipped.weapon?.atk || 0) : (player.equipped.armor?.def || 0);
    const itemVal = isWeapon ? (item.atk || 0) : (item.def || 0);
    
    const diff = itemVal - currentVal;
    const sign = diff > 0 ? '▲' : diff < 0 ? '▼' : '-';
    const statName = isWeapon ? i18n.t('stat.atk') : i18n.t('stat.def');

    // [ATK: 0 → 10 (▲10)] 형태
    message += ` [${statName}: ${currentVal} → ${itemVal} (${sign}${Math.abs(diff)})]`;
  }

  return message;
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
