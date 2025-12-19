import fs from 'fs'
import path from 'path'
import { Item } from '../types'

export interface DropEntry {
  itemId: string
  chance: number
  quantity?: [number, number]
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
  private items: Record<string, Item> = {}
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

  /** spawn 시점에 몬스터에게 드랍을 부여 */
  public generateDrops(dropTableId: string): DropResult {
    const table = this.tables[dropTableId] || this.tables['none']
    const gold = this.randomRange(table.gold[0], table.gold[1])
    const drops: Item[] = []
    
    for (const entry of table.items) {
        const _random = Math.random()
      if (_random <= entry.chance) {
        const quantity = entry.quantity ? this.randomRange(entry.quantity[0], entry.quantity[1]) : 1
        drops.push({ 
            ...this.items[entry.itemId], 
            quantity 
        } as Item)
      }
    }

    return { gold, drops }
  }
}
