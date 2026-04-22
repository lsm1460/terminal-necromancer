import { EventLedger } from '~/core/EventLedger'
import { Broadcast } from '~/systems/Broadcast'
import { ConfigSystem } from '~/systems/ConfigSystem'
import { NPCManager } from '~/systems/NpcManager'
import { QuestManager } from '~/systems/QuestManager'
import { SaveSystem } from '~/systems/SaveSystem'
import { Battle } from '../battle'
import { CombatUnit } from '../battle/unit/CombatUnit'
import { EventBus } from '../EventBus'
import { DropSystem } from '../item/DropSystem'
import { MonsterFactory } from '../MonsterFactory'
import { Player } from '../player/Player'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { World } from '../World'
import { IMapManager, Tile } from './map'

export type AttackType = 'melee' | 'ranged' | 'explode'

export type LevelData = {
  level: number
  expRequired: number
  atk: number
  def: number
  hp: number
  mp: number
}

export interface StatModifier {
  key: string; // 'atk', 'def', 'maxHp' 등
  value: (current: number, player: Player) => number;
}

export type PositionType = {
  x: number
  y: number
}

export type SkillResult = {
  isSuccess: boolean
}

export type ExecuteSkill<T extends Player = Player> = (
  player: CombatUnit<T>,
  context: { world: World; eventBus: EventBus },
  units?: {
    ally?: CombatUnit[]
    enemies?: CombatUnit[]
  }
) => Promise<SkillResult>

// 3. 스킬 인터페이스 정의
export interface Skill<T extends Player = Player> {
  id: string
  name: string
  attackType?: AttackType
  description: string
  cost: number
  requiredExp: number
  requiredLevel: number
  unlocks: string[]
  unlockHint: string
  execute: ExecuteSkill<T>
}

export interface TranslationInfo {
  key: string;
  args?: Record<string, any>;
}

export type Translatable = string | TranslationInfo;

export interface GameContext<TPlayer = Player> {
  player: TPlayer
  map: IMapManager
  npcs: NPCManager
  world: World
  events: EventLedger
  eventBus: EventBus
  drop: DropSystem
  save: SaveSystem
  battle: Battle
  npcSkills: NpcSkillManager
  broadcast: Broadcast
  monster: MonsterFactory
  config: ConfigSystem
  cheats: {
    isFullMap?: boolean
    playerIsHide?: boolean
  }
  quest: QuestManager
  pendingAction?: (input: string) => void // 특수 프롬프트 응답 처리용 콜백

  currentTile: Tile
}



export * from './battle'
export * from './events'
export * from './map'
export * from './npc'
export * from './skill'


