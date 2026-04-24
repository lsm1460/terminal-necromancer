import { Item } from '~/core/item/Item'
import { Drop, IItemGenerator } from '../types'

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
  private items: Record<string, Drop> = {}
  private tables: Record<string, DropTable> = {}

  constructor(
    itemData: any,
    dropTableData: any,
    private itemGenerator?: IItemGenerator
  ) {
    this.items = itemData
    this.tables = dropTableData

    this.validateTables()
  }

  private validateTables() {
    for (const [tableId, table] of Object.entries(this.tables)) {
      for (const entry of table.items) {
        if (!this.items[entry.itemId]) {
          throw new Error(`Invalid itemId [${entry.itemId}] in DropTable [${tableId}]`)
        }
      }
    }
  }

  private randomRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  public generateDrops(dropTableId: string): DropResult {
    if (!this.itemGenerator) return { gold: 0, drops: [] }

    const table = this.tables[dropTableId] || this.tables['none']

    if (!table) return { gold: 0, drops: [] }

    const gold = this.randomRange(table.gold[0], table.gold[1])

    const drops: Item[] = table.items
      .filter((entry) => Math.random() <= entry.chance)
      .map((entry) => {
        const baseItem = this.items[entry.itemId]
        const dropData = {
          ...baseItem,
          ...entry,
          quantity: entry.quantity ? this.randomRange(entry.quantity[0], entry.quantity[1]) : 1,
        }
        return this.itemGenerator!.createItem(dropData as any)
      })

    return { gold, drops }
  }
}
