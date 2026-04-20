import { CombatUnit } from '../battle/unit/CombatUnit'
import { EventBus } from '../EventBus'
import { Player } from '../player/Player'
import { World } from '../World'

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

export * from './battle'
export * from './events'
export * from './skill'