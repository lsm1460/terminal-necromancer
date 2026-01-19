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
  type: 'deBuff' | 'bind' | 'buff' | 'dot'
  atk?: number
  agi?: number
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
  onDeath?: () => void
  applyEffect: (_buff: Buff) => void
  applyBuff: (_buff: Buff) => void
  applyDeBuff: (_buff: Buff) => void
  takeDamage: <T extends BattleTarget | Player>(
    attacker: CombatUnit<T>,
    options?: CalcDamageOptions
  ) => Promise<DamageResult>
}

export class Battle {
  private unitCache = new Map<any, CombatUnit>()

  constructor(public player: Player) {}

  async runCombatLoop(enemies: CombatUnit[], context: GameContext) {
    console.log(`\n⚔️  전투가 시작되었습니다!`)
    console.log(`적: ${enemies.map((e) => e.name).join(', ')}`)

    enemies.forEach((e) => {
      e.onDeath = () => this.handleUnitDeath(e.ref, context)
    })

    let turn = 0
    while (this.player.isAlive && enemies.some((e) => e.ref.isAlive)) {
      turn++

      const turnOrder = this.getTurnOrder(enemies)

      console.log(`\n============== turn: ${turn} ==============`)

      // 1. 민첩(AGI) 기반 턴 순서 정렬 (매 라운드마다 갱신)
      for (const unit of turnOrder) {
        // 전투 도중 누군가 죽었다면 체크
        if (!unit.ref.isAlive) continue
        if (!this.player.isAlive || !enemies.some((e) => e.ref.isAlive)) break

        console.log(`\n━━━━━━━━━ [ ${unit.name}의 차례 ] ━━━━━━━━━`)
        this.updateEffectsDuration(unit)

        // 2. [출혈/독 등] 지속 피해 적용
        // 업데이트 후에도 남아있는 효과들에 대해서만 데미지 발생
        const dotEffects = unit.deBuff.filter((d) => d.type === 'dot')
        for (const effect of dotEffects) {
          const damage = Math.max(1, effect.atk || 0)
          unit.ref.hp -= damage
          console.log(` └ 🩸 [${effect.name}] 피해: -${damage} (남은 지속: ${effect.duration}턴)`)

          if (unit.ref.hp <= 0) {
            unit.ref.isAlive = false
            console.log(` └ 💀 ${unit.name}이(가) 출혈 과다로 사망했습니다.`)
            unit.onDeath && unit.onDeath()

            await delay()
            break
          }
        }

        if (!unit.ref.isAlive) continue

        // 3. [추가] 속박(bind) 상태 체크
        // updateEffectsDuration 후에도 bind가 남아있다면 이번 턴은 행동 불능입니다.
        const bindEffect = unit.deBuff.find((d) => d.type === 'bind')

        if (bindEffect) {
          console.log(
            `\n⛓️  ${unit.name}은(는) ${bindEffect.name}에 갇혀 움직일 수 없습니다! (남은 기간: ${bindEffect.duration}턴)`
          )
          // 행동을 수행하지 않고 다음 유닛으로 넘어갑니다.
          continue
        }

        let enemiesSide = _.chain(turnOrder)
          .filter((unit) => unit.type !== 'player' && unit.type !== 'minion' && unit.ref.isAlive)
          .sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0))
          .value()

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

        if (unit.type === 'player') {
          // 플레이어 직접 조작
          const playerUnit = unit as unknown as CombatUnit<Player>
          const isEscaped = await this.handlePlayerAction(playerUnit, playerSide, enemiesSide, context)

          if (isEscaped) {
            // 전투 종료
            return false
          }
        } else if (unit.type === 'minion') {
          await this.executeAutoAttack(unit, enemiesSide, playerSide, context)
        } else {
          // npc라면 같은 faction만 ally로..
          enemiesSide = enemiesSide.filter((e) => (e.ref as NPC).faction === (unit.ref as NPC).faction)

          await this.executeAutoAttack(unit, playerSide, enemiesSide, context)
        }

        // 가독성을 위한 짧은 지연
        await delay()
      }
    }

    this.handleBattleEnd()

    return true
  }

  // --- 내부 로직 함수들 ---
  private getTurnOrder(enemies: CombatUnit[]): CombatUnit[] {
    const units: CombatUnit[] = []

    // 2. 플레이어 캐싱 및 콜백 주입
    let pUnit = this.unitCache.get(this.player)
    if (!pUnit) {
      pUnit = this.toCombatUnit(this.player, 'player')
      this.unitCache.set(this.player, pUnit)
    }
    units.push(pUnit)

    // 3. 미니언 캐싱 및 콜백 주입 (새로 소환된 미니언 포함)
    if (this.player.minions) {
      this.player.minions.forEach((m) => {
        if (m.isAlive) {
          let mUnit = this.unitCache.get(m)
          if (!mUnit) {
            mUnit = this.toCombatUnit(m, 'minion')
            mUnit.onDeath = () => this.handleMinionsDeath(mUnit!, enemies)
            this.unitCache.set(m, mUnit)
          }
          units.push(mUnit)
        }
      })
    }

    // 4. 적군 추가
    enemies.forEach((e) => {
      if (e.ref.isAlive) {
        this.unitCache.set(e.ref, e)
        units.push(e)
      }
    })

    const getEffectiveAgi = (unit: CombatUnit): number => {
      let finalAgi = unit.stats.agi

      // 버프 배열: agi가 있으면 더함
      unit.buff.forEach((b) => {
        if (b.agi) finalAgi += b.agi
      })

      // 디버프 배열: agi가 있으면 뺌
      unit.deBuff.forEach((d) => {
        if (d.agi) finalAgi -= d.agi
      })

      return finalAgi
    }

    return units.sort((a, b) => {
      const diff = getEffectiveAgi(b) - getEffectiveAgi(a)

      // 민첩 수치가 같다면 플레이어 진영 우선 (안정적인 게임 경험을 위해)
      if (diff === 0) {
        const priority = (u: CombatUnit) => (['npc', 'monster'].includes(u.type) ? 1 : 0)
        return priority(a) - priority(b)
      }

      return diff
    })
  }

  private async handlePlayerAction(
    playerUnit: CombatUnit<Player>,
    playerSide: CombatUnit[],
    enemies: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    const aliveEnemies = enemies.filter((e) => e.ref.isAlive)

    const { action } = await enquirer.prompt<{ action: string }>({
      type: 'select',
      name: 'action',
      message: '당신의 행동을 선택하세요:',
      choices: ['공격', '스킬', '아이템', '도망'],
    })

    switch (action) {
      case '공격':
        {
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
            return await this.handlePlayerAction(playerUnit, playerSide, enemies, context)
          }

          const target = aliveEnemies.find((e) => e.id === targetId)

          if (target) {
            // 공격 실행
            await target.takeDamage(playerUnit)
          }
        }
        break
      case '스킬':
        {
          const ally = playerSide.filter((unit) => unit.type !== 'player')
          const { isSuccess } = await SkillManager.requestAndExecuteSkill(playerUnit, context, {
            ally,
            enemies: aliveEnemies,
          })
          if (!isSuccess) {
            // 스킬 사용을 취소했거나 실패했다면 다시 행동 선택으로
            return await this.handlePlayerAction(playerUnit, playerSide, enemies, context)
          }
        }
        break

      case '아이템':
        await playerUnit.ref.useItem()
        break

      case '도망': {
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
        this.unitCache.clear()

        return true
      }

      default:
        break
    }

    return false
  }

  private async executeAutoAttack(
    attacker: CombatUnit,
    targets: CombatUnit[],
    ally: CombatUnit[],
    context: GameContext
  ) {
    if (targets.length === 0) return
    const target = targets[0]

    const autoSkillId = context.npcSkills.getRandomSkillId(attacker.ref.skills || [])
    if (autoSkillId) {
      await context.npcSkills.execute(autoSkillId, attacker, ally, targets)
    } else {
      await target.takeDamage(attacker)
    }
  }

  private async handleMinionsDeath(deathUnit: CombatUnit, enemies: CombatUnit[]) {
    deathUnit.ref.hp = 0
    deathUnit.ref.isAlive = false

    this.player.removeMinion(deathUnit.ref.id)

    console.log(`\n💀 ${deathUnit.ref.name}이(가) 쓰러졌습니다!`)
  }

  private handleUnitDeath(target: BattleTarget, context: GameContext) {
    const { world, drop: dropTable, npcs } = context
    const { x, y } = this.player.pos // 현재 위치

    // 1. 기본 사망 상태 설정
    target.hp = 0
    target.isAlive = false

    console.log(`\n💀 ${target.name}이(가) 쓰러졌습니다!`)
    target.deathLine && console.log(target.deathLine)

    // 2. 전리품 및 경험치 처리 (플레이어 진영이 죽인 경우만 해당될 수 있음)
    // 편의를 위해 더 큰 타입인 NPC로 처리
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
      applyEffect: (newEffect: Buff) => {
        // 1. 타입에 따라 대상 배열 결정 ('buff'면 buff, 나머지는 deBuff)
        const targetArray = newEffect.type === 'buff' ? combatUnit.buff : combatUnit.deBuff

        // 2. 중복 확인 및 처리
        const existing = targetArray.find((e) => e.name === newEffect.name)
        if (existing) {
          existing.duration = Math.max(existing.duration, newEffect.duration)
        } else {
          targetArray.push(newEffect)
        }
      },
      applyBuff: (b: Buff) => combatUnit.applyEffect(b),
      applyDeBuff: (d: Buff) => combatUnit.applyEffect(d),
      takeDamage: async (attacker, options = {}) => {
        if (!combatUnit.ref.isAlive) {
          return {
            isEscape: false,
            damage: 0,
            isCritical: false,
            currentHp: 0,
            isDead: true,
          }
        }

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
          if (combatUnit.onDeath) {
            await combatUnit.onDeath()
          }

          await this.onAffix('death', attacker as CombatUnit, combatUnit as CombatUnit)
        }

        if (!isDead && !isEscape) await this.onAffix('afterHit', attacker as CombatUnit, combatUnit as CombatUnit)

        return {
          ...result,
          currentHp: combatUnit.ref.hp,
          isDead: combatUnit.ref.hp <= 0,
        }
      },
    }

    return combatUnit
  }

  private handleBattleEnd() {
    this.unitCache.clear()

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
      skillAtkMult?: number // 데미지 배율
      rawDamage?: number // 직접 계산된 데미지 (시체 폭발 등)
      isIgnoreDef?: boolean // 방어력 무시
      isFixed?: boolean // 고정 데미지
      isSureHit?: boolean // 회피불가
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
    const effectTypes: ('buff' | 'deBuff')[] = ['buff', 'deBuff']

    effectTypes.forEach((type) => {
      if (!unit[type]) return

      // 지속 시간 차감
      unit[type].forEach((effect) => {
        effect.duration--
      })

      // 만료된 효과 추출 (로그용)
      const expiredEffects = unit[type].filter((e) => e.duration <= 0)

      expiredEffects.forEach((e) => {
        const icon = type === 'buff' ? '✨' : '💢'
        console.log(`[효과 만료] ${unit.name}의 ${icon} [${e.name}] 효과가 사라졌습니다.`)
      })

      // 지속 시간이 남은 효과들만 유지
      unit[type] = unit[type].filter((e) => e.duration > 0)
    })
  }

  async onAffix(event: string, attacker: CombatUnit, defender: CombatUnit) {
    if (attacker.ref.isMinion) {
      // 공격자가 미니언인 경우
      switch (event) {
        case 'afterHit':
          // 공격 후 발동하는 어픽스들
          await this.handleAfterAttackAffixes(attacker, defender)
          break
  
        default:
          break
      }
    } else if (defender.ref.isMinion) {
      // 수비자가 미니언인 경우
      switch (event) {
  
        case 'death':
          // 사망 시 발동하는 어픽스 (예: DOOMSDAY)
          await this.handleOnDeathAffixes(defender)
          break
  
        default:
          break
      }
    }

  }

  private async handleOnDeathAffixes(deathUnit: CombatUnit) {
    if (this.player.hasAffix('DOOMSDAY') && deathUnit.ref.isSkeleton) {
      const enemies = Array.from(this.unitCache.values()).filter(
        (u) => ['monster', 'npc'].includes(u.type) && u.ref.isAlive
      )

      const rawExplosionDamage = Math.floor(deathUnit.ref.maxHp * 0.6)

      console.log(`\n[🔥 종말]: ${deathUnit.name}의 시체가 폭발합니다!`)

      await delay(500)
      for (const enemy of enemies) {
        if (enemy.ref.hp === 0) {
          continue
        }

        await enemy.takeDamage(deathUnit, {
          rawDamage: rawExplosionDamage,
          isIgnoreDef: false, // 시체 폭발이 방어력을 무시하게 하려면 true로 변경
          isSureHit: false, // 회피 불가능하게 하려면 true로 변경
        })

        await delay(300)
      }
    }
  }

  private async handleAfterAttackAffixes(attacker: CombatUnit, defender: CombatUnit) {
    // 1. FROSTBORNE (서리 서린 유해)
    if (this.player.hasAffix('FROSTBORNE') && attacker.ref.isSkeleton) {
      console.log(`[❄️] 스켈레톤이 머금은 심연의 한기가 대상(${defender.name})을 얼려버립니다.`)

      defender.applyDeBuff({
        name: '심연의 한기',
        type: 'deBuff',
        duration: 3,
        agi: 5,
      })
    }
  }
}
