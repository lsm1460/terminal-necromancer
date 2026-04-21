import { Item } from '~/core/item/Item'
import { ItemRarity, ItemType, RaritySetting } from '~/types/item'
import { GameItem } from './GameItem'
import { IGameItemFactory } from '~/core/item/types'
import { GameWeapon } from './GameWeapon'
import { GameAmor } from './GameAmor'
import { GameConsumable } from './GameConsumable'

export class GameItemFactory implements IGameItemFactory {
  make<TItem = GameItem>(data: Partial<Item>) {
    if (data.type === ItemType.WEAPON) {
      return new GameWeapon(data) as TItem
    } else if (data.type === ItemType.ARMOR) {
      return new GameAmor(data) as TItem
    } else if ([ItemType.FOOD, ItemType.CONSUMABLE].includes(data.type as ItemType)) {
      return new GameConsumable(data) as TItem
    }

    return new GameItem(data) as TItem
  }
}
