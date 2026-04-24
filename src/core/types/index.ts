import { EventLedger } from '~/core/EventLedger'
import { Battle } from '../battle'
import { CombatUnit } from '../battle/unit/CombatUnit'
import { EventBus } from '../EventBus'
import { DropSystem } from '../item/DropSystem'
import { ItemGenerator } from '../item/ItemGenerator'
import { MapData } from '../map/MapData'
import { MonsterFactory } from '../MonsterFactory'
import { BaseNPC } from '../npc/BaseNPC'
import { NPCData } from '../npc/NPCData'
import { Player } from '../player/Player'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { World } from '../World'
import { IMapManager, Tile } from './map'
import { INpcManager, NPCState } from './npc'
import { PassiveDefinition, SpecialSkillLogic } from './skill'

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
  key: string // 'atk', 'def', 'maxHp' 등
  value: (current: number, player: Player) => number
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
  key: string
  args?: Record<string, any>
}

export type Translatable = string | TranslationInfo

export interface DefaultContextTypes {
  player: Player
  npcs: INpcManager
}

export interface ICommandManager {
  register(key: string, fn: CommandFunction): void
  handle(rawCmd: string, context: GameContext): Promise<string | boolean>
}

export interface GameContext<T extends Partial<DefaultContextTypes> = DefaultContextTypes> {
  player: 'player' extends keyof T ? T['player'] : DefaultContextTypes['player']
  map: IMapManager
  npcs: 'npcs' extends keyof T ? T['npcs'] : DefaultContextTypes['npcs']
  world: World
  events: EventLedger
  eventBus: EventBus
  drop: DropSystem
  save?: ISaveSystem
  battle: Battle
  npcSkills: NpcSkillManager
  monster: MonsterFactory
  config?: IConfigSystem
  cheats: {
    isFullMap?: boolean
    playerIsHide?: boolean
  }
  pendingAction?: (input: string) => void // 특수 프롬프트 응답 처리용 콜백
  commands: ICommandManager

  currentTile: Tile
}

export interface Renderer<C = any> {
  print(message: string): void
  update(message: string): void
  availableTalks(list: { name: string; hasQuest: boolean }[]): void
  clear(): void
  printStatus(context: C): void
  // 입력 관련 메서드 추가
  select(message: string, choices: { name: string; message: string }[], defaultValue?: string): Promise<string>
  confirm(message: string): Promise<boolean>
  prompt(message: string): Promise<void> // 기존의 alert 역할을 prompt로 명칭 변경
  multiselect(
    message: string,
    choices: { name: string; message: string }[],
    options?: { initial?: string[]; maxChoices?: number }
  ): Promise<string[]>
  move(directions: string[]): void
  look(message: string, name: string, type: string): void
  pick(name: string, message: string): void
  attack(message: string, prefix?: string): void
  skill(message: string, prefix?: string): void
  talk(name: string): void
  printNpcCard(npc: BaseNPC): void
}

export interface ICommandSystem {
  install(handler: ICommandManager): void
}

export type CommandFunction<C extends GameContext<any> = GameContext<DefaultContextTypes>> = (
  args: string[],
  context: C
) => boolean | string | Promise<boolean | string>

export type CustomCommands = Record<string, CommandFunction<any>>

export interface IQuestManager {
  hasQuest: () => boolean
  startQuest: (context: GameContext) => Promise<void>
}

export interface ISaveSystem<SaveData = any> {
  load: () => SaveData | null
  save: (data: SaveData) => void
}

export interface IConfigSystem<ConfigData = any> {
  load: () => ConfigData | null
  save: (data: ConfigData) => void
}

export interface IMonsterEvent {
  handle: (params: { tile: Tile; isPassMonster: boolean }) => Promise<void>
}

export interface IAssets {
  map: any
  monsterGroup: any
  monster: any
  state: any
  level: any
  item: any
  drop: any
  npc: any
  npcSkills: any
  achievements: any
}

export type InstallContext = Partial<GameContext> & {
  eventBus: EventBus
  monster: MonsterFactory
  battle: Battle
  world: World
}

export interface RequiredEngineDependencies {
  renderer: Renderer
  eventBus: EventBus
  player: Player
  itemGenerator: ItemGenerator
}

export interface OptionalEngineDependencies {
  saveSystem?: ISaveSystem
  configSystem?: IConfigSystem
  skills?: {
    passive?: Record<string, PassiveDefinition>
    specials?: Record<string, SpecialSkillLogic>
  }
  quest?: IQuestManager
  MapManager?: new (data: MapData, eventBus: EventBus) => IMapManager
  NpcManager?: new (data: NPCData, eventBus: EventBus) => INpcManager
  customCommandsMap?: Record<string, string[]>
  commandSystems?: (new <T extends GameContext<any>>(context: T) => ICommandSystem)[]
  MonsterEvent?: new (monsterFactory: MonsterFactory, eventBus: EventBus, battle: Battle, world: World) => IMonsterEvent
}

export interface UnitSprites {
  idle: HTMLImageElement[]
  attack: HTMLImageElement | null
  hit: HTMLImageElement | null
  die: HTMLImageElement | null
  escape: HTMLImageElement | null
  isFallback?: boolean
}

export type MonsterGroupMember = {
  id: string
  encounterRate: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'
export type Vector = { dx: number; dy: number }

export type LootBag = {
  id: string
  scendId: string
  tileId: string
  exp: number
  gold: number
}

export type SaveData<T extends Player = Player, M = Record<string, unknown>> = {
  player: T
  sceneId: string
  npcs: {
    states: Record<string, NPCState>
  } & M
  drop: LootBag | null
  completedEvents: string[]
}

export type Corpse<M = {}> = {
  x?: number
  y?: number
  maxHp: number
  atk: number
  def: number
  agi: number
  name: string
  id: string
} & M

export * from './battle'
export * from './events'
export * from './map'
export * from './npc'
export * from './skill'
export * from './item'

