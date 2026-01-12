import fs from 'fs'
import path from 'path'
import { Drop, Item } from '../types'
import { generateId } from '../utils'

export interface DropEntry {
  itemId: string
  chance: number
  quantity?: [number, number]
  minRarity?: 'common' | 'rare' | 'epic'
}

export interface DropTable {
  gold: [number, number]
  items: DropEntry[]
}

export interface DropResult {
  gold: number
  drops: Item[]
}

export class DropSystem {
  private items: Record<string, Drop> = {}
  private tables: Record<string, DropTable> = {}

  constructor(itemJsonPath: string, dropTableJsonPath: string) {
    this.items = JSON.parse(fs.readFileSync(path.resolve(itemJsonPath), 'utf-8'))
    this.tables = JSON.parse(fs.readFileSync(path.resolve(dropTableJsonPath), 'utf-8'))
    this.validateTables()
  }

  private validateTables() {
    for (const table of Object.values(this.tables)) {
      for (const entry of table.items) {
        if (!this.items[entry.itemId]) {
          throw new Error(`Invalid itemId in DropTable: ${entry.itemId}`)
        }
      }
    }
  }

  private randomRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /** 수치 처리 헬퍼 (배열이면 랜덤, 숫자면 그대로) */
  private finalizeStat(stat: any): number {
    if (!stat) return 0
    if (Array.isArray(stat)) {
      const [min, max] = stat
      // 소수점 포함 여부에 따라 처리 분기
      return min % 1 !== 0 || max % 1 !== 0
        ? Number((Math.random() * (max - min) + min).toFixed(3))
        : this.randomRange(min, max)
    }
    return stat
  }

  /** 능력치에 따른 접두사 반환 */
  private getPrefix(value: number, min: number, max: number): string {
    if (value === max) return '장인의 '
    if (value === min) return '낡은 '
    return ''
  }

  /** spawn 시점에 몬스터에게 드랍을 부여 */
  public generateDrops(dropTableId: string): DropResult {
    const table = this.tables[dropTableId] || this.tables['none']
    const gold = this.randomRange(table.gold[0], table.gold[1])

    const drops: Item[] = table.items
      .filter((entry) => Math.random() <= entry.chance)
      .map((entry) => ({
        ...this.items[entry.itemId],
        quantity: entry.quantity ? this.randomRange(entry.quantity[0], entry.quantity[1]) : 1,
      }))
      // 1. 무기 처리 (ID 변경 + 공격력 결정 + 접두사)
      .map((item) => {
        if (item.type !== 'weapon' || !item.atk) return item

        const [min, max] = item.atk
        const finalAtk = this.randomRange(min, max)

        return {
          ...item,
          id: generateId(item.id),
          atk: finalAtk,
          label: this.getPrefix(finalAtk, min, max) + item.label,
          crit: this.finalizeStat(item.crit),
        }
      })
      // 2. 방어구 처리 (ID 변경 + 방어력 결정 + 접두사)
      .map((item) => {
        if (item.type !== 'armor' || !item.def) return item

        const [min, max] = item.def
        const finalDef = this.randomRange(min, max)

        return {
          ...item,
          id: generateId(item.id), 
          def: finalDef,
          label: this.getPrefix(finalDef, min, max) + item.label,
        }
      })

    return { gold, drops }
  }

  getItem(_itemId: string) {
    return this.items[_itemId] as Item
  }
}
