import enquirer from 'enquirer'
import _ from 'lodash'
import { AttackRangeType, BattleTarget, Drop, GameContext, NPC } from '../../types'
import { delay } from '../../utils'
import { LootFactory } from '../LootFactory'
import { MonsterFactory } from '../MonsterFactory'
import { Player } from '../Player'
import { SkillManager } from '../skill'
import { AffixManager } from './AffixManager'
import { CombatUnit } from './CombatUnit'
import { TargetSelector } from './TargetSelector'
import { NpcSkillManager } from '../skill/NpcSkillManger'

export type DamageOptions = {
  skillAtkMult?: number // 데미지 배율
  rawDamage?: number // 직접 계산된 데미지 (시체 폭발 등)
  isIgnoreDef?: boolean // 방어력 무시
  isFixed?: boolean // 고정 데미지
  isSureHit?: boolean // 회피불가
  isSureCrit?: boolean // 무조건 치명타
  rangeType?: AttackRangeType
  isPassive?: boolean
}

export type Buff = {
  name: string
  duration: number
  type: 'deBuff' | 'bind' | 'buff' | 'dot' | 'focus' | 'stealth' | 'expose'
  atk?: number
  agi?: number
  def?: number
  eva?: number
  hp?: number
  crit?: number
}

export type CalcDamageOptions = NonNullable<Parameters<typeof Battle.calcDamage>[2]>
export type CalcDamageResult = ReturnType<typeof Battle.calcDamage>

// 전투 로그 출력을 위해 추가 정보가 포함된 확장 반환 타입
export interface DamageResult extends CalcDamageResult {
  currentHp: number
  isDead: boolean
}

export class Battle {
  private unitCache = new Map<any, CombatUnit>()

  constructor(
    private player: Player,
    public monster: MonsterFactory,
    public npcSkills: NpcSkillManager
  ) {}

  private get aliveEnemies(): CombatUnit[] {
    return Array.from(this.unitCache.values()).filter(
      (unit) => ['monster', 'npc'].includes(unit.type) && unit.ref.isAlive
    )
  }

  async runCombatLoop(initialEnemies: CombatUnit[], context: GameContext) {
    initialEnemies.forEach((e) => {
      this.unitCache.set(e.ref.id, e)
      // 공통 사망 로직 주입
      e.onDeathHooks.push(async () => this.handleUnitDeath(e.ref as BattleTarget, context))
    })

    console.log(`\n⚔️ 전투가 시작되었습니다!`)
    console.log(`적: ${this.aliveEnemies.map((e) => e.name).join(', ')}`)

    let turn = 0
    while (this.player.isAlive && this.aliveEnemies.some((e) => e.ref.isAlive)) {
      turn++

      const turnOrder = this.getTurnOrder()

      console.log(`\n============== turn: ${turn} ==============`)

      // 1. 민첩(AGI) 기반 턴 순서 정렬 (매 라운드마다 갱신)
      for (const unit of turnOrder) {
        // 전투 도중 누군가 죽었다면 체크
        if (!unit.ref.isAlive) continue
        if (!this.player.isAlive || !this.aliveEnemies.some((e) => e.ref.isAlive)) break

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
            if (effect.name === '출혈') {
              console.log(` └ 💀 ${unit.name}이(가) 출혈 과다로 사망했습니다.`)
            } else if (effect.name === '중독') {
              console.log(` └ 💀 ${unit.name}이(가) 중독으로 사망했습니다.`)
            }
            await unit.dead()

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
          .value() as CombatUnit<BattleTarget>[]

        const playerSide = _.chain(turnOrder)
          .filter((unit) => (unit.type === 'minion' || unit.type === 'player') && unit.ref.isAlive)
          .sortBy((unit) => {
            if (unit.type === 'player') {
              return Infinity // 플레이어는 가장 큰 값을 주어 무조건 마지막으로 보냄
            }
            // 미니언은 player.minions 배열의 인덱스 순서대로 (0, 1, 2...)
            return _.findIndex(this.player.minions, { id: unit.id })
          })
          .value() as CombatUnit<BattleTarget>[]

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

  /**
   * 현재 전투에 참여 중인 모든 유닛의 턴 순서를 결정합니다.
   */
  getTurnOrder(): CombatUnit[] {
    // 1. 플레이어 유닛 보장 (캐시에 없으면 생성 및 주입)
    this.toCombatUnit(this.player, 'player')

    // 2. 미니언 유닛 최신화 (새로 소환된 미니언이 있을 수 있으므로 체크)
    if (this.player.minions) {
      this.player.minions.forEach((m) => {
        // 살아있고 아직 캐시에 등록되지 않은 미니언만 주입
        if (m.isAlive && !this.unitCache.has(m.id)) {
          const mUnit = this.toCombatUnit(m, 'minion')
          // 미니언 전용 사망 훅 주입
          mUnit.onDeathHooks.push(async () => await this.handleMinionsDeath(mUnit, this.aliveEnemies))
        }
      })
    }

    // 3. unitCache에 있는 모든 유닛 중 '살아있는' 유닛들만 추출하여 정렬
    // 플레이어, 미니언, 몬스터가 모두 포함됩니다.
    return Array.from(this.unitCache.values())
      .filter((unit) => unit.ref.isAlive)
      .sort((a, b) => {
        // 민첩성(AGI) 기준 내림차순 정렬
        const agiA = a.stats?.agi ?? 0
        const agiB = b.stats?.agi ?? 0

        if (agiB !== agiA) {
          return agiB - agiA
        }

        // 민첩성이 같다면 플레이어 진영(player, minion)에게 우선권 부여 (선택 사항)
        const priority: Record<string, number> = { player: 3, minion: 2, monster: 1, npc: 1 }
        return (priority[b.type] ?? 0) - (priority[a.type] ?? 0)
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
      choices: ['상태', '공격', '스킬', '아이템', '도망'],
    })

    const renderLine = (unit: CombatUnit, isLead: boolean) => {
      const leadLabel = isLead ? '🚩 [선두]' : '         '
      // 이름은 14칸 확보하여 정렬, 체력은 (현재/최대) 형식
      let line = `${leadLabel} ${unit.name} (${unit.ref.hp}/${unit.ref.maxHp})`

      // 2. 버프/디버프 텍스트 생성
      const buffText = unit.buff
        .map((b) => `\x1b[32m[${b.name}:${b.duration}턴]\x1b[0m`) // 초록색 버프
        .join(' ')

      const deBuffText = unit.deBuff
        .map((d) => `\x1b[31m[${d.name}:${d.duration}턴]\x1b[0m`) // 빨간색 디버프
        .join(' ')

      // 3. 상태 이상이 있을 때만 줄바꿈(\n)과 함께 상세 내용 추가
      if (buffText || deBuffText) {
        line += `\n         └─ 상태: ${buffText} ${deBuffText}`.trimEnd()
      }

      return line
    }

    switch (action) {
      case '상태':
        {
          console.log('\n━━━━━━━━━━━━━━━━━━━━ 전장 상황 ━━━━━━━━━━━━━━━━━━━━')

          // 1. 아군 출력 (입력 순서대로: 0번이 선두)
          console.log(' [🛡️ 아군 진영]')
          playerSide.forEach((unit, i) => {
            console.log(renderLine(unit, i === 0))
          })

          console.log('──────────────────────────────────────────────────')

          // 2. 적군 출력 (입력 순서대로: 0번이 선두)
          console.log(' [⚔️ 적군 진영]')
          aliveEnemies.forEach((unit, i) => {
            console.log(renderLine(unit, i === 0))
          })

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        }
        return await this.handlePlayerAction(playerUnit, playerSide, enemies, context)
      case '공격':
        {
          const choices = new TargetSelector(aliveEnemies).excludeStealth().build()

          const { targetId } = await enquirer.prompt<{ targetId: string }>({
            type: 'select',
            name: 'targetId',
            message: '누구를 공격하시겠습니까?',
            choices: [
              ...choices,
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
            await target.executeHit(playerUnit, { rangeType: playerUnit.rangeType })
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
        const isUse = await playerUnit.ref.useItem()

        if (!isUse) {
          // 아이템 사용 취소 시 다시 행동 선택으로
          return await this.handlePlayerAction(playerUnit, playerSide, enemies, context)
        }
        break

      case '도망': {
        const isEscapeBlocked = aliveEnemies.some((e) => (e.ref as BattleTarget).noEscape === true)

        if (isEscapeBlocked) {
          const blocker = aliveEnemies.find((e) => (e.ref as BattleTarget).noEscape === true)
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
    targets: CombatUnit<BattleTarget>[],
    ally: CombatUnit[],
    context: GameContext
  ) {
    // 은신 상태인 타겟은 거름
    const visibleTargets = targets.filter((t) => !t.buff.some((b) => b.type === 'stealth'))

    if (visibleTargets.length === 0) {
      console.log(` > ${attacker.name}(이)가 공격할 대상을 찾지 못해 두리번거립니다...`)
      return
    }

    const autoSkillId = this.npcSkills.getRandomSkillId(attacker)
    if (autoSkillId) {
      await this.npcSkills.execute(autoSkillId, attacker, ally, visibleTargets, context)
    } else {
      let target: CombatUnit
      if (['monster', 'npc'].includes(attacker.type)) {
        target = AffixManager.handleBeforeAttack(this.player, attacker, visibleTargets)
      } else {
        // attacker is minion..
        target = [...visibleTargets].sort((a, b) => {
          const aHasFocus = a.deBuff.some((b) => b.type === 'focus') ? 1 : 0
          const bHasFocus = b.deBuff.some((b) => b.type === 'focus') ? 1 : 0

          return bHasFocus - aHasFocus // focus가 있는 유닛을 배열의 맨 앞으로
        })[0] as CombatUnit
      }

      if (attacker.stats.atk > 0) {
        await target.executeHit(attacker, { rangeType: attacker.rangeType })
      } else {
        console.log(`${attacker.name}은 가만히 서있을 뿐이다.`)
      }
    }

    attacker.removeStealth()
  }

  private async handleMinionsDeath(deathUnit: CombatUnit<BattleTarget>, enemies: CombatUnit[]) {
    this.unitCache.delete(deathUnit.ref)

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
    this.unitCache.delete(target)

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

    if (!npc.noCorpse) {
      // 시체 생성 (네크로맨서의 핵심!)
      world.addCorpse({
        ...npc,
        x,
        y,
      })
      console.log(`🦴 그 자리에 ${target.name}의 시체가 남았습니다.`)
    } else {
      console.log(`${target.name}이/가 연기처럼 사라졌다.`)
    }
  }

  public toCombatUnit<T extends Player | BattleTarget>(unit: T, type: CombatUnit['type']): CombatUnit<T> {
    // 이미 캐싱되어 있다면 반환
    if (this.unitCache.has(unit.id)) {
      return this.unitCache.get(unit.id) as CombatUnit<T>
    }

    const combatUnit = new CombatUnit<T>(unit, type)

    // NpcSkillManager를 통해 패시브 주입 (기존에 정의한 로직)
    this.npcSkills.setupPassiveHook(combatUnit, this)

    // 캐시에 등록
    this.unitCache.set(unit.id, combatUnit)

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

  static calcDamage(attacker: CombatUnit, target: CombatUnit, options: DamageOptions = {}) {
    const { atk, crit } = attacker.finalStats
    const { def, eva } = target.finalStats

    // 1. 회피 판정
    if (!options.isSureHit && Math.random() < eva) {
      return { isEscape: true, damage: 0, isCritical: false }
    }

    // 2. 기초 데미지 결정 (rawDamage가 없으면 계산된 atk 사용)
    const baseAtk = (options.rawDamage ?? atk) * (options.skillAtkMult ?? 1)

    // 3. 크리티컬 판정
    const isCrit = options.isSureCrit || Math.random() < crit
    let finalDamage = isCrit ? baseAtk * 1.2 : baseAtk

    // 4. 방어력 적용
    if (!options.isFixed) {
      const appliedDef = options.isIgnoreDef ? 0 : def
      finalDamage = Math.max(1, finalDamage - Math.floor(appliedDef / 2))
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

  public _spawnMonster(monsterId: string, context: GameContext) {
    const monster = this.monster.makeMonster(monsterId)
    if (!monster) return

    const unit = this.toCombatUnit(monster, 'monster')
    unit.onDeathHooks.push(async () => this.handleUnitDeath(monster as BattleTarget, context))

    // 이제 currentEnemies.push 대신 unitCache에 이미 들어있음 (toCombatUnit 내부 로직)
    return unit
  }

  public getEnemiesOf(attacker: CombatUnit): CombatUnit[] {
    // 1. 진영 그룹 정의
    const playerSideTypes = ['player', 'minion']
    const enemySideTypes = ['monster', 'npc']

    // 2. 공격자가 어느 진영인지 확인
    const isPlayerSide = playerSideTypes.includes(attacker.type)

    // 3. 캐시에서 반대 진영 필터링
    return Array.from(this.unitCache.values()).filter((unit) => {
      // 이미 죽은 유닛은 제외
      if (!unit.ref.isAlive) return false

      if (isPlayerSide) {
        // 플레이어 측이 공격자라면: 적은 enemySideTypes에 포함된 유닛
        return enemySideTypes.includes(unit.type)
      } else {
        // 몬스터/NPC가 공격자라면: 적은 playerSideTypes에 포함된 유닛
        return playerSideTypes.includes(unit.type)
      }
    })
  }
}
