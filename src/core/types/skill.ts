import { Battle, CalcDamageOptions, DamageOptions } from "../battle"
import { BuffOptions } from "../battle/Buff"
import { CombatUnit } from "../battle/unit/CombatUnit"
import { AttackType } from "../types"

export type SkillTargetType =
  | 'ENEMY_SINGLE'
  | 'ENEMY_DOUBLE'
  | 'ENEMY_BACK'
  | 'ENEMY_LOWEST_HP'
  | 'ENEMY_ALL'
  | 'ALLY_SINGLE'
  | 'ALLY_LOWEST_HP'
  | 'ALLY_ALL'
  | 'SINGLE_BUFF'
  | 'ENEMY_RANDOM'
  | 'SELF'
  | 'PLAYER'
  
export type NpcSkill = {
  id: string
  name: string
  attackType?: AttackType
  description: string
  chance: number
  power: number
  targetType: SkillTargetType
  type: string // "physical", "dark", "holy" 등 자유롭게 확장 가능
  buff?: BuffOptions
  options?: CalcDamageOptions & {
    spawnMonsterId?: string
  }
}

type PassiveEffect = (
  attacker: CombatUnit,
  defender: CombatUnit,
  skill: NpcSkill,
  battle: Battle,
  options: DamageOptions,
  damage?: number
) => Promise<void>

export interface PassiveDefinition {
  onProcessHit?: PassiveEffect
  onBeforeAttack?: PassiveEffect
  onAfterAttack?: PassiveEffect
  onAfterHit?: PassiveEffect
  onDeath?: (attacker: CombatUnit, skill: NpcSkill, battle: Battle, options?: DamageOptions) => Promise<void>
}

export type SpecialSkillLogic = (attacker: CombatUnit, targets: CombatUnit[], skill: NpcSkill, context: Battle) => Promise<void>

export interface SkillEffectResult {
  type: string
  skillId: string
  attackerName: string
  targetName: string
  payload: any
}