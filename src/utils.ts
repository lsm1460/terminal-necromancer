import { nanoid } from 'nanoid'
import { Terminal } from './core'

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
