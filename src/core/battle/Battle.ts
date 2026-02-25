import enquirer from 'enquirer'
import _ from 'lodash'
import { AttackType, BattleTarget, Drop, GameContext, NPC } from '~/types'
import { delay } from '~/utils'
import { LootFactory } from '../LootFactory'
import { MonsterFactory } from '../MonsterFactory'
import { Player } from '../player/Player'
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
  attackType?: AttackType
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
  isLocked?: boolean
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

  private get aliveEnemies() {
    return Array.from(this.unitCache.values())
      .filter((unit) => ['monster', 'npc'].includes(unit.type) && unit.ref.isAlive)
      .sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0)) as CombatUnit<BattleTarget>[]
  }

  private initPlayerUnit() {
    const pUnit = this.toCombatUnit(this.player, 'player')

    this.registerUnitCache(pUnit)

    // 2. 미니언 유닛 최신화 (새로 소환된 미니언이 있을 수 있으므로 체크)
    if (this.player.minions) {
      this.player.minions.forEach((m) => {
        // 살아있고 아직 캐시에 등록되지 않은 미니언만 주입
        if (m.isAlive) {
          const mUnit = this.toCombatUnit(m, 'minion')
          this.registerUnitCache(mUnit)

          // 미니언 전용 사망 훅 주입
          mUnit.onDeath = async () => await this.handleMinionsDeath(mUnit)
        }
      })
    }
  }

  private registerUnitCache(unit: CombatUnit) {
    if (this.unitCache.has(unit.id)) {
      return
    }

    this.unitCache.set(unit.id, unit)
  }

  private async handleUnitDeBuff(unit: CombatUnit) {
    // 1. 지속 피해(DOT) 처리
    const dotEffects = unit.deBuff.filter((d) => d.type === 'dot')

    for (const effect of dotEffects) {
      const damage = Math.max(1, effect.atk || 0)
      unit.ref.hp -= damage
      console.log(` └ 🩸 [${effect.name}] 피해: -${damage} (남은 지속: ${effect.duration}턴)`)

      if (unit.ref.hp <= 0) {
        console.log(` └ 💀 ${unit.name}이(가) ${effect.name}으로 사망했습니다.`)

        await unit.dead()
        await delay()
        return true // 사망했으므로 이후 로직 스킵
      }
    }

    // 2. 행동 제약(Bind) 처리
    const bindEffect = unit.deBuff.find((d) => d.type === 'bind')
    if (bindEffect) {
      console.log(
        `\n⛓️  ${unit.name}은(는) ${bindEffect.name}(으)로 인해 움직일 수 없습니다! (남은 기간: ${bindEffect.duration}턴)`
      )
      return true // 속박되었으므로 이번 턴 행동 스킵
    }

    return false // 행동 가능
  }

  private getPlayerSide() {
    return _.chain(Array.from(this.unitCache.values()))
      .filter((unit) => (unit.type === 'minion' || unit.type === 'player') && unit.ref.isAlive)
      .sortBy((unit) => {
        if (unit.type === 'player') {
          return Infinity // 플레이어는 가장 큰 값을 주어 무조건 마지막으로 보냄
        }
        // 미니언은 player.minions 배열의 인덱스 순서대로 (0, 1, 2...)
        return _.findIndex(this.player.minions, { id: unit.id })
      })
      .value() as CombatUnit<BattleTarget>[]
  }

  async runCombatLoop(initialEnemies: CombatUnit[], context: GameContext) {
    initialEnemies.forEach((e) => {
      // 공통 사망 로직 주입
      e.onDeath = async () => await this.handleUnitDeath(e.ref as BattleTarget, context)

      this.registerUnitCache(e)
    })

    console.log(`\n⚔️ 전투가 시작되었습니다!`)
    console.log(`적: ${this.aliveEnemies.map((e) => e.name).join(', ')}`)

    let turn = 0
    while (this.player.isAlive && this.aliveEnemies.length > 0) {
      turn++

      this.initPlayerUnit()
      const turnOrder = this.getTurnOrder()

      console.log(`\n============== turn: ${turn} ==============`)

      // 1. 민첩(AGI) 기반 턴 순서 정렬 (매 라운드마다 갱신)
      for (const unit of turnOrder) {
        // 전투 도중 누군가 죽었다면 체크
        if (!unit.ref.isAlive) continue
        if (!this.player.isAlive || this.aliveEnemies.length === 0) break

        console.log(`\n━━━━━━━━━ [ ${unit.name}의 차례 ] ━━━━━━━━━`)
        this.updateEffectsDuration(unit)
        const isSkip = await this.handleUnitDeBuff(unit)
        if (isSkip) continue

        let enemiesSide = [...this.aliveEnemies]
        const playerSide = this.getPlayerSide()

        if (unit.type === 'player') {
          // 플레이어 직접 조작
          const playerUnit = unit as CombatUnit<Player>
          const isEscaped = await this.handlePlayerAction(playerUnit, playerSide, context)

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

    // 사망 시 player.onDeath에서 player의 체력을 1, alive를 true로 바꾸개 때문에
    // 미리 결과값을 할당
    const result = this.player.isAlive
    this.handleBattleEnd()

    return result
  }

  getTurnOrder(): CombatUnit[] {
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
    // enemies: CombatUnit[],
    context: GameContext
  ): Promise<boolean> {
    const { action } = await enquirer.prompt<{ action: string }>({
      type: 'select',
      name: 'action',
      message: '당신의 행동을 선택하세요:',
      choices: ['상태', '공격', '방어', '스킬', '아이템', '도망'],
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
          this.aliveEnemies.forEach((unit, i) => {
            console.log(renderLine(unit, i === 0))
          })

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        }
        return await this.handlePlayerAction(playerUnit, playerSide, context)
      case '공격':
        {
          const { choices } = new TargetSelector(this.aliveEnemies).excludeStealth().build()

          const { targetId } = await enquirer.prompt<{ targetId: string }>({
            type: 'select',
            name: 'targetId',
            message: '누구를 공격하시겠습니까?',
            choices: [
              ...choices,
              { name: 'cancel', message: '🔙 뒤로가기' }, // 취소 옵션 추가
            ],
            format: (value) => {
              if (value === 'cancel') return '취소'
              const target = this.aliveEnemies.find((e) => e.id === value)

              return target ? target.name : value
            },
          })

          // 취소 선택 시 다시 행동 선택창으로 재귀 호출
          if (targetId === 'cancel') {
            return await this.handlePlayerAction(playerUnit, playerSide, context)
          }

          const target = this.aliveEnemies.find((e) => e.id === targetId)

          if (target) {
            // 공격 실행
            await target.executeHit(playerUnit, { attackType: playerUnit.attackType })
          }
        }
        break
      case '방어':
        console.log(`🛡️ ${playerUnit.name}(이)가 방어 자세를 취합니다! 다음 턴까지 피해를 덜 입습니다.`)
        playerUnit.applyBuff({
          name: '방어',
          type: 'buff',
          def: 10,
          duration: 2,
        })
        break
      case '스킬':
        {
          const ally = playerSide.filter((unit) => unit.type !== 'player')
          const { isSuccess } = await SkillManager.requestAndExecuteSkill(playerUnit, context, {
            ally,
            enemies: this.aliveEnemies,
          })
          if (!isSuccess) {
            // 스킬 사용을 취소했거나 실패했다면 다시 행동 선택으로
            return await this.handlePlayerAction(playerUnit, playerSide, context)
          }
        }
        break

      case '아이템':
        const isUse = await playerUnit.ref.useItem()

        if (!isUse) {
          // 아이템 사용 취소 시 다시 행동 선택으로
          return await this.handlePlayerAction(playerUnit, playerSide, context)
        }
        break

      case '도망': {
        const isEscapeBlocked = this.aliveEnemies.some((e) => (e.ref as BattleTarget).noEscape === true)

        if (isEscapeBlocked) {
          const blocker = this.aliveEnemies.find((e) => (e.ref as BattleTarget).noEscape === true)
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

    const autoSkill = this.npcSkills.getRandomSkill(attacker)
    
    if (autoSkill) {
      await this.npcSkills.execute(autoSkill.id, attacker, ally, visibleTargets, context)
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
        await target.executeHit(attacker, { attackType: attacker.attackType })
      } else {
        console.log(`${attacker.name}은 가만히 서있을 뿐이다.`)

        return
      }
    }

    autoSkill?.buff?.type !== 'stealth' && attacker.removeStealth()
  }

  private async handleMinionsDeath(deathUnit: CombatUnit<BattleTarget>) {
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
    target.isNpc && (target as NPC).dead()

    const { gold, drops } = LootFactory.fromTarget(target, dropTable)

    this.player.gainExp(target.exp || 0)
    this.player.gainGold(gold)

    let logMessage = `✨ ${target.name} 처치! EXP +${target.exp || 0}`
    if (gold > 0) logMessage += `, 골드 +${gold}`
    console.log(logMessage)

    // 아이템 드랍
    drops.forEach((d) => {
      world.addDrop({ ...d, x, y } as Drop)
      const qtyText = d.quantity !== undefined ? ` ${d.quantity}개` : ''
      console.log(`📦 ${target.name}은(는) ${d.label}${qtyText}을(를) 떨어뜨렸습니다.`)
    })

    if (!target.noCorpse) {
      // 시체 생성 (네크로맨서의 핵심!)
      world.addCorpse({
        ...target,
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
    this.registerUnitCache(unit)

    unit.onDeath = async () => await this.handleUnitDeath(monster as BattleTarget, context)

    return unit
  }

  public getEnemiesOf(attacker: CombatUnit): CombatUnit[] {
    const playerSideTypes = ['player', 'minion']
    const enemySideTypes = ['monster', 'npc']

    const isPlayerSide = playerSideTypes.includes(attacker.type)

    return Array.from(this.unitCache.values()).filter((unit) => {
      if (!unit.ref.isAlive) return false

      if (isPlayerSide) {
        return enemySideTypes.includes(unit.type)
      } else {
        return playerSideTypes.includes(unit.type)
      }
    })
  }
}
