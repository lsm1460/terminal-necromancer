import enquirer from 'enquirer'
import { Player } from './Player'
import { BattleTarget, Drop, GameContext } from '../types'
import { LootFactory } from './LootFactory'
import { SkillManager } from './skill'

interface IUnit {
  id?: string
  name?: string
  hp: number
  maxHp?: number
  atk: number
  def: number
  agi: number
  isAlive: boolean
  minions?: any[] // 플레이어만 가질 수 있음
}

export interface CombatUnit {
  id: string
  name: string
  type: 'player' | 'minion' | 'monster' | 'npc'
  stats: {
    hp: number
    maxHp: number
    agi: number
    atk: number
    def: number
  }
  isAlive: boolean
  ref: BattleTarget // 원본 객체 참조 (데이터 직접 수정용)
}

export class Battle {
  /**
   * 전투 메인 루프 실행
   * @param player 플레이어 객체
   * @param enemies 적 배열 (몬스터 또는 적대적 NPC)
   */
  static async runCombatLoop(player: Player, enemies: BattleTarget[], context: GameContext) {
    console.clear()
    console.log(`\n⚔️  전투가 시작되었습니다!`)
    console.log(`적: ${enemies.map((e) => e.name).join(', ')}`)

    while (player.isAlive && enemies.some((e) => e.isAlive)) {
      // 1. 민첩(AGI) 기반 턴 순서 정렬 (매 라운드마다 갱신)
      const turnOrder = this.getTurnOrder(player, enemies)

      for (const unit of turnOrder) {
        // 전투 도중 누군가 죽었다면 체크
        if (!unit.ref.isAlive) continue
        if (!player.isAlive || !enemies.some((e) => e.isAlive)) break

        console.log(`\n━━━━━━━━━ [ ${unit.name}의 차례 ] ━━━━━━━━━`)

        if (unit.type === 'player') {
          // 플레이어 직접 조작
          const isEscaped = await this.handlePlayerAction(player, enemies, context)

          if (isEscaped) {
            // 전투 종료
            return
          }
        } else if (unit.type === 'minion') {
          // 미니언 자동 공격 (적들 중 첫 번째 살아있는 적 타겟)
          this.executeAutoAttack(
            unit,
            enemies.filter((e) => e.isAlive),
            player,
            context
          )
        } else {
          // 몬스터/NPC 자동 공격 (플레이어 진영 중 타겟팅)
          const playerSide = [...(player.minions?.filter((m: any) => m.isAlive) || []), player]
          this.executeAutoAttack(unit, playerSide, player, context)
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
      player.minions.forEach((m: any) => {
        if (m.isAlive) units.push(this.toCombatUnit(m, 'minion'))
      })
    }

    // 적(몬스터/NPC) 추가
    enemies.forEach((e) => {
      if (e.isAlive) {
        const type = (e as any).encounterRate !== undefined ? 'monster' : 'npc'
        units.push(this.toCombatUnit(e, type))
      }
    })

    // 민첩 내림차순 정렬
    return units.sort((a, b) => b.stats.agi - a.stats.agi)
  }

  private static async handlePlayerAction(
    player: Player,
    enemies: BattleTarget[],
    context: GameContext
  ): Promise<boolean> {
    const aliveEnemies = enemies.filter((e) => e.isAlive)

    const { action } = (await enquirer.prompt({
      type: 'select',
      name: 'action',
      message: '당신의 행동을 선택하세요:',
      choices: ['공격', '스킬', '도망'],
    })) as any

    if (action === '공격') {
      const { targetId } = (await enquirer.prompt({
        type: 'select',
        name: 'targetId',
        message: '누구를 공격하시겠습니까?',
        choices: aliveEnemies.map((e) => ({
          name: e.id,
          message: `${e.name} (HP: ${e.hp})`,
        })),
        format(value) {
          const target = aliveEnemies.find((e) => e.id === value)

          return target ? target.name : value
        },
      })) as any

      const target = aliveEnemies.find((e) => e.id === targetId)

      if (target) this.applyDamage(target, player, context)
    } else if (action === '스킬') {
      const success = await SkillManager.requestAndExecuteSkill(player, context)
      if (!success) {
        // 스킬 사용을 취소했거나 실패했다면 다시 행동 선택으로
        return await this.handlePlayerAction(player, enemies, context)
      }
    } else if (action === '도망') {
      const isEscapeBlocked = aliveEnemies.some((e) => e.noEscape === true)

      if (isEscapeBlocked) {
        const blocker = aliveEnemies.find((e) => e.noEscape === true)
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

  private static executeAutoAttack(attacker: CombatUnit, targets: IUnit[], player: Player, context: GameContext) {
    if (targets.length === 0) return
    const target = targets[0]
    this.applyDamage(target, player, context, attacker.ref)
  }

  private static handleUnitDeath(player: Player, target: BattleTarget, context: GameContext) {
    const { world, drop: dropTable } = context
    const { x, y } = player.pos // 현재 위치

    // 1. 기본 사망 상태 설정
    target.hp = 0
    target.isAlive = false
    console.log(`\n💀 ${target.name}이(가) 쓰러졌습니다!`)

    // 2. 전리품 및 경험치 처리 (플레이어 진영이 죽인 경우만 해당될 수 있음)
    // NPC나 몬스터가 죽었을 때만 실행
    
    if (target.isMinion) {
      player.removeMinion(target.id)
    } else if (!target.isMinion && (target.exp || target.dropTableId)) {
      const { gold, drops } = LootFactory.fromTarget(target, dropTable)

      player.gainExp(target.exp || 0)
      player.gainGold(gold)

      let logMessage = `✨ ${target.name} 처치! EXP +${target.exp || 0}`
      if (gold > 0) logMessage += `, 골드 +${gold}`
      console.log(logMessage)

      // 아이템 드랍
      drops.forEach((d) => {
        world.addDrop({ ...d, x, y } as Drop)
        const qtyText = d.quantity !== undefined ? ` ${d.quantity}개` : ''
        console.log(`📦 ${target.name}은(는) ${d.label}${qtyText}을(를) 떨어뜨렸습니다.`)
      })

      // 시체 생성 (네크로맨서의 핵심!)
      world.addCorpse({
        ...target,
        x,
        y,
      })
      console.log(`🦴 그 자리에 ${target.name}의 시체가 남았습니다.`)
    }
  }

  private static applyDamage(defender: IUnit, player: Player, context: GameContext, attacker?: BattleTarget) {
    const atk = attacker?.atk || player.atk
    const def = defender.def || 0

    const damage = Math.max(1, atk - Math.floor(def / 2))
    defender.hp -= damage

    console.log(`💥 ${attacker?.name || '플레이어'}의 공격! ${defender.name || '플레이어'}에게 ${damage}의 피해!`)

    if (defender.hp <= 0) {
      this.handleUnitDeath(player, defender as BattleTarget, context)
    }
  }

  private static toCombatUnit(unit: IUnit, type: CombatUnit['type']): CombatUnit {
    return {
      id: unit.id || 'player',
      name: unit.name || 'player',
      type,
      stats: {
        hp: unit.hp,
        maxHp: unit.maxHp || unit.hp,
        agi: unit.agi || 0,
        atk: unit.atk || 0,
        def: unit.def || 0,
      },
      isAlive: unit.isAlive,
      ref: unit as BattleTarget,
    }
  }

  private static printBattleResult(player: Player) {
    if (player.isAlive) {
      console.log(`\n🏆 전투에서 승리했습니다!`)
    } else {
      console.log(`\n💀 전투에서 패배했습니다...`)
    }
  }

  static executeGroupCounter(
    player: Player,
    context: GameContext,
    isPrimaryDead?: boolean,
    primaryTarget?: BattleTarget
  ): boolean {
    const tile = context.map.getTile(player.pos.x, player.pos.y)
    const enemies: BattleTarget[] = []

    if (!isPrimaryDead && primaryTarget) enemies.push(primaryTarget)
    ;(tile?.npcIds || []).forEach((id: string) => {
      const npc = context.npcs.getNPC(id)
      if (npc && npc.isAlive && context.npcs.isHostile(id) && npc.id !== primaryTarget?.id) {
        enemies.push(npc)
      }
    })

    if (enemies.length === 0) return false

    if (enemies.length > 1) {
      console.log(`📢 주변의 적 ${enemies.length}명이 일제히 공격합니다!`)
    }

    for (const enemy of enemies) {
      const counterDmg = this.calculateDamage(player, enemy)

      // 소환수가 대신 맞기
      if (player.skeleton.length > 0) {
        const minion = player.skeleton[0]
        const minionFinalDmg = Math.max(enemy.atk - minion.def, 1)
        minion.hp -= minionFinalDmg

        console.log(`🛡️  [방어] ${minion.name}(이)가 대신 공격을 막았습니다! (-${minionFinalDmg} HP)`)

        if (minion.hp <= 0) {
          console.log(`💀 [파괴] ${minion.name}(이)가 산산조각 났습니다.`)
          player.skeleton.shift()
        }
      } else {
        console.log(`🏹 ${enemy.name}의 공격! ${counterDmg} 피해`)
        const isPlayerDead = player.damage(counterDmg)

        if (isPlayerDead) {
          return true
        }
      }
    }

    if (player.hp > 0) {
      console.log(`🩸 플레이어 남은 HP: ${player.hp}`)
    }

    return false
  }

  static calculateDamage(player: Player, target: BattleTarget) {
    return Math.max(target.atk - player.computed.def, 1)
  }
}
