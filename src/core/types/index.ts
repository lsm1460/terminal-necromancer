import { EventLedger } from '~/core/EventLedger'
import { Broadcast } from '~/systems/Broadcast'
import { ConfigSystem } from '~/systems/ConfigSystem'
import { QuestManager } from '~/systems/QuestManager'
import { SaveSystem } from '~/systems/SaveSystem'
import { Battle } from '../battle'
import { CombatUnit } from '../battle/unit/CombatUnit'
import { EventBus } from '../EventBus'
import { DropSystem } from '../item/DropSystem'
import { MonsterFactory } from '../MonsterFactory'
import { BaseNPC } from '../npc/BaseNPC'
import { Player } from '../player/Player'
import { NpcSkillManager } from '../skill/npcs/NpcSkillManger'
import { World } from '../World'
import { IMapManager, Tile } from './map'
import { INpcManager } from './npc'

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

export interface DefaultContextTypes {
  player: Player;
  npcs: INpcManager;
}

export interface ICommandManager {
  register(key: string, fn: CommandFunction): void
  handle(rawCmd: string, context: GameContext): Promise<string | boolean>
}

export interface GameContext<T extends Partial<DefaultContextTypes> = DefaultContextTypes> {
  player: 'player' extends keyof T ? T['player'] : DefaultContextTypes['player'];
  map: IMapManager
  npcs: 'npcs' extends keyof T ? T['npcs'] : DefaultContextTypes['npcs'];
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

export * from './battle'
export * from './events'
export * from './map'
export * from './npc'
export * from './skill'


