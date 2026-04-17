import { ItemRarity } from '~/core/item/consts'
import { Item } from '~/core/item/Item'
import { ItemGenerator } from '~/core/item/ItemGenerator'
import { Affix, Drop } from '~/types/item'
import { ItemPolicy } from './item/ItemPolicy'

export interface DropEntry {
  itemId: string
  chance: number
  quantity?: [number, number]
  minRarity?: ItemRarity
  maxRarity?: ItemRarity
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
  private itemGenerator: ItemGenerator<ItemRarity, Affix, Drop>

  constructor(itemData: any, dropTableData: any) {
    this.itemGenerator = new ItemGenerator(new ItemPolicy())

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
    const table = this.tables[dropTableId] || this.tables['none']

    if (!table) return { gold: 0, drops: [] }

    const gold = this.randomRange(table.gold[0], table.gold[1])

    const drops: Item[] = table.items
      .filter((entry) => Math.random() <= entry.chance)
      .map((entry) => {
        const baseItem = this.items[entry.itemId]
        const dropData = {
          ...baseItem,
          quantity: entry.quantity ? this.randomRange(entry.quantity[0], entry.quantity[1]) : 1,
          minRarity: entry.minRarity,
          maxRarity: entry.maxRarity,
        }
        return this.itemGenerator.createItem(dropData as any)
      })

    return { gold, drops }
  }
}
