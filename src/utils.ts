import { randomBytes } from 'crypto'
import { Item, ItemType } from './types'
import { Player } from './core/Player'

export function generateId(baseId?: string, length = 8): string {
  const uniqueHash = randomBytes(length).toString('hex')
  return baseId ? `${baseId}_${uniqueHash}` : uniqueHash
}

export function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function delay(amount: number = 1500) {
  await new Promise((resolve) => setTimeout(resolve, amount))
}

export function makeItemMessage(item: Item, player: Player) {
  const typeMap: Partial<Record<ItemType, string>> = {
      weapon: '무기',
      armor: '방어구',
      food: '음식',
    }
    
    const typeLabel = typeMap[item!.type] || '아이템'
    
  let message = `[${typeLabel}] ${item.label}${item.quantity ? ` (${item.quantity}개)` : ''}`

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
