import { nanoid } from 'nanoid'

export function generateId(baseId?: string, length = 8): string {
  const uniqueHash = nanoid(length)
  return baseId ? `${baseId}::${uniqueHash}` : uniqueHash
}

export const rollFromRange = (range: [number, number], isInteger: boolean = false): number => {
  const [min, max] = range

  if (isInteger) {
    const minInt = Math.ceil(min)
    const maxInt = Math.floor(max)
    return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt
  }

  const precision = 100 // 소수점 둘째 자리 정밀도
  const minInt = Math.round(min * precision)
  const maxInt = Math.round(max * precision)
  const randomInt = Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt

  return randomInt / precision
}
