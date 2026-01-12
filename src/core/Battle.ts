import enquirer from 'enquirer'
import { Player } from './Player'
import { BattleTarget, Drop, GameContext, NPC } from '../types'
import { LootFactory } from './LootFactory'
import { SkillManager } from './skill'
import _ from 'lodash'

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
  atk?: number
  def?: number
  eva?: number
  hp?: number
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
}

export class Battle {
  static async runCombatLoop(player: Player, enemies: BattleTarget[], context: GameContext) {
    console.clear()
    console.log(`\n⚔️  전투가 시작되었습니다!`)
    console.log(`적: ${enemies.map((e) => e.name).join(', ')}`)

    while (player.isAlive && enemies.some((e) => e.isAlive)) {
      // 1. 민첩(AGI) 기반 턴 순서 정렬 (매 라운드마다 갱신)
      const turnOrder = this.getTurnOrder(player, enemies)
      let enemiesSide = _.chain(turnOrder)
        .filter((unit) => unit.type !== 'player' && unit.type !== 'minion' && unit.ref.isAlive)
        .sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0))
        .value()

      for (const unit of turnOrder) {
        // 전투 도중 누군가 죽었다면 체크
        if (!unit.ref.isAlive) continue
        if (!player.isAlive || !enemies.some((e) => e.isAlive)) break

        const playerSide = _.chain(turnOrder)
          .filter((unit) => (unit.type === 'minion' || unit.type === 'player') && unit.ref.isAlive)
          .sortBy((unit) => {
            if (unit.type === 'player') {
              return Infinity // 플레이어는 가장 큰 값을 주어 무조건 마지막으로 보냄
            }
            // 미니언은 player.minions 배열의 인덱스 순서대로 (0, 1, 2...)
            return _.findIndex(player.minions, { id: unit.id })
          })
          .value()

        console.log(`\n━━━━━━━━━ [ ${unit.name}의 차례 ] ━━━━━━━━━`)

        if (unit.type === 'player') {
          // 플레이어 직접 조작
          const playerUnit = unit as unknown as CombatUnit<Player>
          const isEscaped = await this.handlePlayerAction(playerUnit, enemiesSide, context)

          if (isEscaped) {
            // 전투 종료
            return
          }
        } else if (unit.type === 'minion') {
          this.executeAutoAttack(unit, enemiesSide, playerSide, player, context)
        } else {
          // npc라면 같은 faction만 ally로..
          enemiesSide = enemiesSide.filter((e) => (e.ref as NPC).faction === (unit.ref as NPC).faction)

          this.executeAutoAttack(unit, playerSide, enemiesSide, player, context)
        }

        // 가독성을 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }

    this.printBattleResult(player)
  }

  // --- 내부 로직 함수들 ---
  private static getTurnOrder(player: Player, enemies: BattleTarget[]): CombatUnit[] {
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
      if (e.isAlive) {
        const type = e.encounterRate !== undefined ? 'monster' : 'npc'
        units.push(this.toCombatUnit(e, type))
      }
    })

    // 민첩 내림차순 정렬
    return units.sort((a, b) => b.stats.agi - a.stats.agi)
  }

  private static async handlePlayerAction(
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
        this.applyDamage(target, playerUnit, playerUnit.ref, context)
      }
    } else if (action === '스킬') {
      const success = await SkillManager.requestAndExecuteSkill(playerUnit.ref, context)
      if (!success) {
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

  private static executeAutoAttack(
    attacker: CombatUnit,
    targets: CombatUnit[],
    ally: CombatUnit[],
    player: Player,
    context: GameContext
  ) {
    if (targets.length === 0) return
    const target = targets[0]

    const autoSkillId = context.npcSkills.getRandomSkillId(attacker.ref.skills || [])
    if (autoSkillId) {
      const resTargets = context.npcSkills.execute(autoSkillId, attacker, ally, targets)

      resTargets
        .filter((target) => target.ref.hp < 1)
        .forEach((unit) => this.handleUnitDeath(player, unit.ref, context))
    } else {
      this.applyDamage(target, attacker, player, context)
    }
  }

  private static handleUnitDeath(player: Player, target: BattleTarget, context: GameContext) {
    const { world, drop: dropTable, npcs } = context
    const { x, y } = player.pos // 현재 위치

    // 1. 기본 사망 상태 설정
    target.hp = 0
    target.isAlive = false

    console.log(`\n💀 ${target.name}이(가) 쓰러졌습니다!`)
    target.deathLine && console.log(`${target.name}: ${target.deathLine}`)

    // 2. 전리품 및 경험치 처리 (플레이어 진영이 죽인 경우만 해당될 수 있음)
    // NPC나 몬스터가 죽었을 때만 실행

    if (target.isMinion) {
      player.removeMinion(target.id)
    } else if (!target.isMinion && (target.exp || target.dropTableId)) {
      // npc
      const npc = target as NPC

      npcs.dead(npc.id)
      
      npc.faction && context.npcs.setFactionHostility(npc.faction, 100)

      const { gold, drops } = LootFactory.fromTarget(npc, dropTable)

      player.gainExp(npc.exp || 0)
      player.gainGold(gold)

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

  private static applyDamage(
    defender: CombatUnit,
    attacker: CombatUnit<BattleTarget | Player>,
    player: Player,
    context: GameContext
  ) {
    let hostility = 5

    const { isEscape, damage, isCritical } = this.calcDamage(attacker, defender)
    if (isEscape) {
      console.log(
        `💥 ${attacker.name}의 공격! ${defender.name}은/는 회피했다! (남은 HP: ${Math.max(0, defender.ref.hp)})`
      )
    } else {
      defender.ref.hp -= damage

      if (isCritical) {
        console.log(
          `⚡ CRITICAL HIT! ⚡ ${attacker.name}의 치명적인 일격! ${defender.name}에게 ${damage}의 강력한 피해! (남은 HP: ${Math.max(0, defender.ref.hp)})`
        )
      } else {
        console.log(
          `💥 ${attacker.name}의 공격! ${defender.name}에게 ${damage}의 피해! (남은 HP: ${Math.max(0, defender.ref.hp)})`
        )
      }
    }

    if (defender.ref.hp <= 0 && defender.type !== 'player') {
      this.handleUnitDeath(player, defender.ref, context)

      return
    }

    const _npc = defender.ref as NPC

    if (_npc.faction) {
      context.npcs.updateFactionHostility(_npc.faction, hostility)
    }
  }

  private static toCombatUnit(unit: IUnit, type: CombatUnit['type']): CombatUnit {
    return {
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
      ref: unit as BattleTarget,
    }
  }

  private static printBattleResult(player: Player) {
    if (player.isAlive) {
      console.log(`\n🏆 전투에서 승리했습니다!`)
    } else {
      console.log(`\n💀 전투에서 패배했습니다...`)

      player?.onDeath && player.onDeath()
    }
  }

  static calcDamage(
    attacker: CombatUnit<BattleTarget | Player>,
    target: CombatUnit,
    options: {
      skillAtkMult?: number
      isIgnoreDef?: boolean
      isFixed?: boolean
      isSureHit?: boolean
    } = {}
  ) {
    // 1. 공격자의 최종 ATK 계산 (기본 + 버프 - 디버프)
    const attackerBuffAtk = attacker.buff.reduce((acc, b) => acc + (b.atk || 0), 0)
    const attackerDeBuffAtk = attacker.deBuff?.reduce((acc, d) => acc + (d.atk || 0), 0) || 0

    let finalAtk = Math.max(0, attacker.stats.atk + attackerBuffAtk - attackerDeBuffAtk)
    finalAtk *= options.skillAtkMult || 1

    // 2. 방어자의 최종 DEF, EVA 계산 (기본 + 버프 - 디버프)
    const targetBuffDef = target.buff.reduce((acc, b) => acc + (b.def || 0), 0)
    const targetDeBuffDef = target.deBuff?.reduce((acc, d) => acc + (d.def || 0), 0) || 0
    const finalDef = Math.max(0, target.stats.def + targetBuffDef - targetDeBuffDef)

    const targetBuffEva = target.buff.reduce((acc, b) => acc + (b.eva || 0), 0)
    const targetDeBuffEva = target.deBuff?.reduce((acc, d) => acc + (d.eva || 0), 0) || 0
    const finalEva = Math.max(0, (target.stats?.eva || 0) + targetBuffEva - targetDeBuffEva)

    // 3. 회피 판정 (필중 무시)
    if (!options.isSureHit && Math.random() < finalEva) {
      return { isEscape: true, damage: 0, isCritical: false }
    }

    // 4. 크리티컬 판정 (예: 10% 확률 또는 attacker stats에 크리티컬 확률이 있다면 활용)
    // 여기서는 예시로 10% 확률로 설정하겠습니다.
    const isCrit = Math.random() < (attacker.stats?.crit || 0)
    if (isCrit) {
      finalAtk *= 1.2
    }

    // 5. 데미지 계산 (고정 데미지 vs 일반 공식)
    let damage: number
    if (options.isFixed) {
      damage = Math.floor(finalAtk)
    } else {
      const effectiveDef = options.isIgnoreDef ? 0 : finalDef
      damage = Math.max(1, Math.floor(finalAtk - Math.floor(effectiveDef / 2)))
    }

    return {
      isEscape: false,
      damage,
      isCritical: isCrit,
    }
  }
}
