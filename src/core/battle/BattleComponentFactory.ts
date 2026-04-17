import { DropSystem } from '~/systems/DropSystem'
import { EventBus } from '~/core/EventBus'
import { Player } from '../player/Player'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { World } from '../World'
import { Battle } from './Battle'
import { BattleActionHandler } from './BattleActionHandler'
import { BattleRewardSystem } from './BattleRewardSystem'
import { BattleUnitManager } from './BattleUnitManager'

export class BattleComponentFactory {
  constructor(
    private player: Player,
    private npcSkills: NpcSkillManager,
    private world: World,
    private dropSystem: DropSystem,
    private eventBus: EventBus,
  ) {}

  createUnits(battle: Battle): BattleUnitManager {
    return new BattleUnitManager(this.player, battle, this.npcSkills)
  }

  createRewards(units: BattleUnitManager): BattleRewardSystem {
    return new BattleRewardSystem(this.player, units, this.world, this.dropSystem)
  }

  createActions(units: BattleUnitManager): BattleActionHandler {
    return new BattleActionHandler(this.eventBus, this.world, units, this.npcSkills)
  }
}
