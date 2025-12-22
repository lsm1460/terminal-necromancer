import { randomBytes } from 'crypto'

export function generateId(baseId?: string, length = 8): string {
  const uniqueHash = randomBytes(length).toString('hex');
  return baseId ? `${baseId}_${uniqueHash}` : uniqueHash;
}

export function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}