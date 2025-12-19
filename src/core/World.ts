import { Drop, LootBag } from "../types"
import { MapManager } from "./MapManager"

export class World {
  lootBags: LootBag | null = null
  drops: Drop[] = []
    
  constructor(
    public map: MapManager
  ) {}


  addDrop(drop: Drop) {
    const existing = this.drops.find(d => d.id === drop.id)

    if (existing && existing.quantity && drop.quantity) {
        existing.quantity += drop.quantity
    } else {
      this.drops.push(drop)
    }
  }

  getDropsAt(x: number, y: number): Drop[] {
    return this.drops.filter(d => d.x === x && d.y === y)
  }

  removeDropById(dropId: string): Drop | undefined {
    const idx = this.drops.findIndex(d => d.id === dropId)
    if (idx === -1) return undefined

    // 배열에서 제거하고 반환
    const [picked] = this.drops.splice(idx, 1)
    return picked
  }

  addLootBag(bag: LootBag) {
    this.lootBags = bag
  }

  getLootBagAt(x: number, y: number): LootBag | undefined {
    return this.lootBags && this.lootBags.x === x && this.lootBags.y === y && this.lootBags || undefined
  }

  removeLootBag() {
    this.lootBags = null
  }
}