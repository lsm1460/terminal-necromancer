import _ from 'lodash'
import { Corpse, Drop, LootBag } from '../types'
import { MapManager } from './MapManager'

export class World {
  lootBags: LootBag | null = null
  drops: Drop[] = []
  corpses: Corpse[] = []

  constructor(public map: MapManager) {}

  addDrop(drop: Drop) {
    const existing = this.drops.find(_.matches({ id: drop.id, x: drop.x, y: drop.y }))
    
    if (existing && existing.quantity && drop.quantity) {
      existing.quantity += drop.quantity
    } else {
      this.drops.push(drop)
    }
  }

  getDropsAt(x: number, y: number): Drop[] {
    return this.drops.filter(_.matches({ x, y }))
  }

  removeDropById(dropId: string, pos: {x: number, y: number}): Drop | undefined {
    const idx = this.drops.findIndex(_.matches({ id: dropId, ...pos }))
    if (idx === -1) return undefined

    // 배열에서 제거하고 반환
    const [picked] = this.drops.splice(idx, 1)
    return picked
  }

  addLootBag(bag: LootBag) {
    this.lootBags = bag
  }

  getLootBagAt(scendId: string, tileId: string): LootBag | undefined {
    return (
      (this.lootBags && this.lootBags.scendId === scendId && this.lootBags.tileId === tileId && this.lootBags) ||
      undefined
    )
  }

  findLootBagAtByScendId(scendId: string): LootBag | undefined {
    return (this.lootBags && this.lootBags.scendId === scendId && this.lootBags) || undefined
  }

  removeLootBag() {
    this.lootBags = null
  }

  addCorpse(corpse: Corpse) {
    this.corpses.push(corpse)
  }

  getCorpsesAt(x: number, y: number): Corpse[] {
    return this.corpses.filter((d) => d.x === x && d.y === y)
  }

  removeCorpse(corpseId: string) {
    const idx = this.corpses.findIndex((c) => c.id === corpseId)
    if (idx === -1) return undefined

    // 배열에서 제거하고 반환
    const [picked] = this.corpses.splice(idx, 1)
    return picked
  }

  clearFloor() {
    this.drops = []
    this.corpses = []
  }
}
