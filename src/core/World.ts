import _ from 'lodash'
import { EventBus } from '~/core/EventBus'
import { Corpse, LootBag, PositionType } from '~/types'
import { GameEventType } from '~/types/event'
import { Drop } from '~/types/item'
import { Item } from './item/Item'
import { Player } from './player/Player'

export class World {
  lootBags: LootBag | null = null
  drops: Drop[] = []
  corpses: Corpse[] = []

  constructor(
    private player: Player,
    eventBus: EventBus
  ) {
    eventBus.subscribe(GameEventType.SKILL_RAISE_SKELETON_SUCCESS, ({ corpseId }) => this.removeCorpse(corpseId))
  }

  addDrop(drop: Drop | Item, quantity = 1) {
    const existing = this.drops.find(_.matches({ id: drop.id }))
    if (existing && existing.quantity && drop.quantity) {
      existing.quantity += drop.quantity
    } else {
      const _dropItem = new Item({ ...drop.raw, quantity }) as Drop

      _dropItem.x = this.player.x
      _dropItem.y = this.player.y

      this.drops.push(_dropItem)
    }
  }

  getDropsAt(pos: PositionType): Drop[] {
    return this.drops.filter(_.matches(pos))
  }

  removeDropById(dropId: string, pos: { x: number; y: number }): Drop | undefined {
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
    this.corpses.push({ ...corpse })
  }

  getCorpsesAt({ x, y }: PositionType): Corpse[] {
    return this.corpses.filter((d) => d.x === x && d.y === y)
  }

  removeCorpse = (corpseId: string) => {
    const idx = this.corpses.findIndex((c) => c.id === corpseId)
    if (idx === -1) return undefined

    const [picked] = this.corpses.splice(idx, 1)

    return picked
  }

  clearFloor() {
    this.drops = []
    this.corpses = []
  }
}
