import { randomBytes } from 'crypto'

export function generateId(length = 8) {
  return randomBytes(length).toString('hex') // 16진수 문자열
}

console.log(generateId()) // 예: "9f1c2a4b8d7e6f0a"
export function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}