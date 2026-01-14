import fs from 'fs'
import path from 'path'
import { ItemRarity } from '../core/item/consts'
import { ItemGenerator } from '../core/item/ItemGenerator'
import { Drop, Item } from '../types'

export interface DropEntry {
  itemId: string
  chance: number
  quantity?: [number, number]
  minRarity?: ItemRarity
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
  private itemGenerator: ItemGenerator

  constructor(itemJsonPath: string, dropTableJsonPath: string) {
    this.itemGenerator = new ItemGenerator()

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

    const drops: Item[] = table.items
      .filter((entry) => Math.random() <= entry.chance)
      .map((entry) => ({
        ...this.items[entry.itemId],
        quantity: entry.quantity ? this.randomRange(entry.quantity[0], entry.quantity[1]) : 1,
        minRarity: entry.minRarity,
      }))
      .map((_item) => this.itemGenerator.createItem(_item))

    return { gold, drops }
  }

  getItem(_itemId: string) {
    return this.items[_itemId] as Item
  }
}
