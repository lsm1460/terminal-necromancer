import enquirer from 'enquirer'
import _ from 'lodash'
import { BattleTarget, Drop, GameContext, NPC } from '../types'
import { delay } from '../utils'
import { LootFactory } from './LootFactory'
import { Player } from './Player'
import { SkillManager } from './skill'

interface CombatStatus {
  atk: number
  def: number
  agi: number
  crit?: number
  eva?: number
}

interface IUnit extends CombatStatus {
  id?: string
  name?: string
  hp: number
  faction?: string
  maxHp?: number
  computed?: CombatStatus
  isAlive: boolean
  orderWeight?: number
  minions?: any[] // 플레이어만 가질 수 있음
}

export type Buff = {
  name: string
  duration: number
  atk?: number
  def?: number
  eva?: number
  hp?: number
}

export type CalcDamageOptions = NonNullable<Parameters<typeof Battle.calcDamage>[2]>
export type CalcDamageResult = ReturnType<typeof Battle.calcDamage>

// 전투 로그 출력을 위해 추가 정보가 포함된 확장 반환 타입
export interface DamageResult extends CalcDamageResult {
  currentHp: number
  isDead: boolean
}

export interface CombatUnit<T = BattleTarget> {
  id: string
  name: string
  type: 'player' | 'minion' | 'monster' | 'npc'
  stats: CombatStatus
  buff: Buff[]
  deBuff: Buff[]
  orderWeight: number
  ref: T // 원본 객체 참조 (데이터 직접 수정용)
  takeDamage: <T extends BattleTarget | Player>(
    attacker: CombatUnit<T>,
    context: GameContext,
    options?: CalcDamageOptions
  ) => DamageResult
}

export class Battle {
  constructor(public player: Player) {}

  async runCombatLoop(enemies: CombatUnit[], context: GameContext) {
    console.clear()
    console.log(`\n⚔️  전투가 시작되었습니다!`)
    console.log(`적: ${enemies.map((e) => e.name).join(', ')}`)

    const turnOrder = this.getTurnOrder(this.player, enemies)
    let turn = 0
    while (this.player.isAlive && enemies.some((e) => e.ref.isAlive)) {
      turn++

      console.log(`\n============== turn: ${turn} ==============`)

      for (const unit of turnOrder) {
        // 1. 민첩(AGI) 기반 턴 순서 정렬 (매 라운드마다 갱신)
        let enemiesSide = _.chain(turnOrder)
          .filter((unit) => unit.type !== 'player' && unit.type !== 'minion' && unit.ref.isAlive)
          .sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0))
          .value()

        // 전투 도중 누군가 죽었다면 체크
        if (!unit.ref.isAlive) continue
        if (!this.player.isAlive || !enemies.some((e) => e.ref.isAlive)) break

        const playerSide = _.chain(turnOrder)
          .filter((unit) => (unit.type === 'minion' || unit.type === 'player') && unit.ref.isAlive)
          .sortBy((unit) => {
            if (unit.type === 'player') {
              return Infinity // 플레이어는 가장 큰 값을 주어 무조건 마지막으로 보냄
            }
            // 미니언은 player.minions 배열의 인덱스 순서대로 (0, 1, 2...)
            return _.findIndex(this.player.minions, { id: unit.id })
          })
          .value()

        console.log(`\n━━━━━━━━━ [ ${unit.name}의 차례 ] ━━━━━━━━━`)
        this.updateEffectsDuration(unit)

        if (unit.type === 'player') {
          // 플레이어 직접 조작
          const playerUnit = unit as unknown as CombatUnit<Player>
          const isEscaped = await this.handlePlayerAction(playerUnit, enemiesSide, context)

          if (isEscaped) {
            // 전투 종료
            return
          }
        } else if (unit.type === 'minion') {
          this.executeAutoAttack(unit, enemiesSide, playerSide, context)
        } else {
          // npc라면 같은 faction만 ally로..
          enemiesSide = enemiesSide.filter((e) => (e.ref as NPC).faction === (unit.ref as NPC).faction)

          this.executeAutoAttack(unit, playerSide, enemiesSide, context)
        }

        // 가독성을 위한 짧은 지연
        await delay()
      }
    }

    this.printBattleResult()
  }

  // --- 내부 로직 함수들 ---
  private getTurnOrder(player: Player, enemies: CombatUnit[]): CombatUnit[] {
    const units: CombatUnit[] = []

    // 플레이어 추가
    units.push(this.toCombatUnit(player, 'player'))

    // 미니언 추가
    if (player.minions) {
      player.minions.forEach((m) => {
        if (m.isAlive) units.push(this.toCombatUnit(m, 'minion'))
      })
    }

    // 적(몬스터/NPC) 추가
    enemies.forEach((e) => {
      if (e.ref.isAlive) {
        units.push(e)
      }
    })

    // 민첩 내림차순 정렬
    return units.sort((a, b) => b.stats.agi - a.stats.agi)
  }

  private async handlePlayerAction(
    playerUnit: CombatUnit<Player>,
    enemies: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    const aliveEnemies = enemies.filter((e) => e.ref.isAlive)

    const { action } = await enquirer.prompt<{ action: string }>({
      type: 'select',
      name: 'action',
      message: '당신의 행동을 선택하세요:',
      choices: ['공격', '스킬', '도망'],
    })

    if (action === '공격') {
      const { targetId } = await enquirer.prompt<{ targetId: string }>({
        type: 'select',
        name: 'targetId',
        message: '누구를 공격하시겠습니까?',
        choices: [
          ...aliveEnemies.map((e) => ({
            name: e.id,
            message: `${e.name} (HP: ${e.ref.hp})`,
          })),
          { name: 'cancel', message: '🔙 뒤로가기' }, // 취소 옵션 추가
        ],
        format(value) {
          if (value === 'cancel') return '취소'
          const target = aliveEnemies.find((e) => e.id === value)
          return target ? target.name : value
        },
      })

      // 취소 선택 시 다시 행동 선택창으로 재귀 호출
      if (targetId === 'cancel') {
        return await this.handlePlayerAction(playerUnit, enemies, context)
      }

      const target = aliveEnemies.find((e) => e.id === targetId)

      if (target) {
        // 공격 실행
        target.takeDamage(playerUnit, context)
      }
    } else if (action === '스킬') {
      const { isSuccess } = await SkillManager.requestAndExecuteSkill(playerUnit, context, aliveEnemies)
      if (!isSuccess) {
        // 스킬 사용을 취소했거나 실패했다면 다시 행동 선택으로
        return await this.handlePlayerAction(playerUnit, enemies, context)
      }
    } else if (action === '도망') {
      const isEscapeBlocked = aliveEnemies.some((e) => e.ref.noEscape === true)

      if (isEscapeBlocked) {
        const blocker = aliveEnemies.find((e) => e.ref.noEscape === true)
        console.log(`\n🚫 도망칠 수 없습니다! ${blocker?.name}(이)가 길을 가로막고 있습니다!`)

        // 도망에 실패했으므로 턴을 낭비하게 하거나,
        // 아니면 다시 선택하게 하려면 여기서 handlePlayerAction을 재귀 호출할 수도 있습니다.
        // 일단은 턴을 날리는 것으로 처리(false 반환)하거나 다시 선택하게 유도합니다.
        // return await this.handlePlayerAction(player, enemies);
        return false
      }

      console.log('\n🏃 전투에서 도망쳤습니다!')

      return true
    }

    return false
  }

  private executeAutoAttack(attacker: CombatUnit, targets: CombatUnit[], ally: CombatUnit[], context: GameContext) {
    if (targets.length === 0) return
    const target = targets[0]

    const autoSkillId = context.npcSkills.getRandomSkillId(attacker.ref.skills || [])
    if (autoSkillId) {
      context.npcSkills.execute(autoSkillId, attacker, ally, targets, context)
    } else {
      target.takeDamage(attacker, context)
    }
  }

  private handleUnitDeath(target: BattleTarget, context: GameContext) {
    const { world, drop: dropTable, npcs } = context
    const { x, y } = this.player.pos // 현재 위치

    // 1. 기본 사망 상태 설정
    target.hp = 0
    target.isAlive = false

    console.log(`\n💀 ${target.name}이(가) 쓰러졌습니다!`)
    target.deathLine && console.log(`${target.name}: ${target.deathLine}`)

    // 2. 전리품 및 경험치 처리 (플레이어 진영이 죽인 경우만 해당될 수 있음)
    // NPC나 몬스터가 죽었을 때만 실행

    if (target.isMinion) {
      this.player.removeMinion(target.id)
    } else if (!target.isMinion && (target.exp || target.dropTableId)) {
      // npc
      const npc = target as NPC

      npcs.dead(npc.id)

      npc.faction && context.npcs.setFactionHostility(npc.faction, 100)

      const { gold, drops } = LootFactory.fromTarget(npc, dropTable)

      this.player.gainExp(npc.exp || 0)
      this.player.gainGold(gold)

      let logMessage = `✨ ${npc.name} 처치! EXP +${npc.exp || 0}`
      if (gold > 0) logMessage += `, 골드 +${gold}`
      console.log(logMessage)

      // 아이템 드랍
      drops.forEach((d) => {
        world.addDrop({ ...d, x, y } as Drop)
        const qtyText = d.quantity !== undefined ? ` ${d.quantity}개` : ''
        console.log(`📦 ${npc.name}은(는) ${d.label}${qtyText}을(를) 떨어뜨렸습니다.`)
      })

      // 시체 생성 (네크로맨서의 핵심!)
      world.addCorpse({
        ...npc,
        x,
        y,
      })
      console.log(`🦴 그 자리에 ${target.name}의 시체가 남았습니다.`)
    }
  }

  public toCombatUnit<T extends BattleTarget | Player>(unit: IUnit, type: CombatUnit['type']): CombatUnit<T> {
    const combatUnit: CombatUnit<T> = {
      id: unit.id || 'player',
      name: unit.name || 'player',
      type,
      stats: {
        atk: unit.computed?.atk || unit.atk || 0,
        def: unit.computed?.def || unit.def || 0,
        agi: unit.computed?.agi || unit.agi || 0,
        eva: unit.computed?.eva || unit.eva || 0,
        crit: unit.computed?.crit || unit.crit || 0,
      },
      buff: [],
      deBuff: [],
      orderWeight: unit?.orderWeight || 0,
      ref: unit as T,
      takeDamage: (attacker, context, options = {}) => {
        const result = Battle.calcDamage(attacker, combatUnit, options)
        const { isEscape, damage, isCritical } = result

        if (!isEscape) {
          combatUnit.ref.hp = Math.max(0, combatUnit.ref.hp - damage)
        }

        const _npc = combatUnit.ref as NPC

        if (_npc.faction) {
          _npc.updateHostility(5)
        }

        const defender = combatUnit
        const currentHp = defender.ref.hp

        if (isEscape) {
          console.log(`💥 ${attacker.name}의 공격! ${defender.name}은/는 회피했다! (남은 HP: ${currentHp})`)
        } else {
          if (isCritical) {
            console.log(
              `⚡ CRITICAL HIT! ⚡ ${attacker.name}의 치명적인 일격! ${defender.name}에게 ${damage}의 강력한 피해! (남은 HP: ${currentHp})`
            )
          } else {
            console.log(`💥 ${attacker.name}의 공격! ${defender.name}에게 ${damage}의 피해! (남은 HP: ${currentHp})`)
          }
        }

        const isDead = combatUnit.ref.hp <= 0

        if (isDead) {
          this.handleUnitDeath(unit as BattleTarget, context)
        }

        return {
          ...result,
          currentHp: combatUnit.ref.hp,
          isDead: combatUnit.ref.hp <= 0,
        }
      },
    }

    return combatUnit
  }

  private printBattleResult() {
    if (this.player.isAlive) {
      console.log(`\n🏆 전투에서 승리했습니다!`)
    } else {
      console.log(`\n💀 전투에서 패배했습니다...`)

      this.player?.onDeath && this.player.onDeath()
    }
  }

  static calcDamage(
    attacker: CombatUnit<BattleTarget | Player>,
    target: CombatUnit<BattleTarget | Player>,
    options: {
      skillAtkMult?: number
      rawDamage?: number // 직접 계산된 데미지 (시체 폭발 등)
      isIgnoreDef?: boolean
      isFixed?: boolean
      isSureHit?: boolean
    } = {}
  ) {
    // 1. 기초 데미지 설정
    let baseAtk = 0

    if (options.rawDamage !== undefined) {
      // 시체 폭발 등 이미 계산된 수치가 들어온 경우
      baseAtk = options.rawDamage
    } else {
      // 일반적인 공격자 ATK 기반 계산
      const attackerBuffAtk = attacker.buff.reduce((acc, b) => acc + (b.atk || 0), 0)
      const attackerDeBuffAtk = attacker.deBuff?.reduce((acc, d) => acc + (d.atk || 0), 0) || 0
      baseAtk = Math.max(0, attacker.stats.atk + attackerBuffAtk - attackerDeBuffAtk)
      baseAtk *= options.skillAtkMult || 1
    }

    // 2. 방어/회피 판정 (기존 로직 유지)
    const targetBuffEva = target.buff.reduce((acc, b) => acc + (b.eva || 0), 0)
    const targetDeBuffEva = target.deBuff?.reduce((acc, d) => acc + (d.eva || 0), 0) || 0
    const finalEva = Math.max(0, (target.stats?.eva || 0) + targetBuffEva - targetDeBuffEva)

    if (!options.isSureHit && Math.random() < finalEva) {
      return { isEscape: true, damage: 0, isCritical: false }
    }

    // 3. 크리티컬 및 방어력 적용
    const isCrit = Math.random() < (attacker.stats?.crit || 0)
    let finalDamage = isCrit ? baseAtk * 1.2 : baseAtk

    if (!options.isFixed) {
      const targetBuffDef = target.buff.reduce((acc, b) => acc + (b.def || 0), 0)
      const targetDeBuffDef = target.deBuff?.reduce((acc, d) => acc + (d.def || 0), 0) || 0
      const finalDef = options.isIgnoreDef ? 0 : Math.max(0, target.stats.def + targetBuffDef - targetDeBuffDef)
      finalDamage = Math.max(1, finalDamage - Math.floor(finalDef / 2))
    }

    return { isEscape: false, damage: Math.floor(finalDamage), isCritical: isCrit }
  }

  private updateEffectsDuration(unit: CombatUnit) {
  const effectTypes: ('buff' | 'deBuff')[] = ['buff', 'deBuff'];

  effectTypes.forEach((type) => {
    if (!unit[type]) return;

    // 지속 시간 차감
    unit[type].forEach((effect) => {
      effect.duration--;
    });

    // 만료된 효과 추출 (로그용)
    const expiredEffects = unit[type].filter((e) => e.duration <= 0);
    
    expiredEffects.forEach((e) => {
      const icon = type === 'buff' ? '✨' : '💢';
      console.log(`[효과 만료] ${unit.name}의 ${icon} [${e.name}] 효과가 사라졌습니다.`);
    });

    // 지속 시간이 남은 효과들만 유지
    unit[type] = unit[type].filter((e) => e.duration > 0);
  });
}
}
