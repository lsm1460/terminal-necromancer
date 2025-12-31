import { Player } from './Player'
import { BattleTarget, GameContext } from '../types'

export class Battle {
  static attack(player: Player, target: BattleTarget, context: GameContext): boolean {
    const { npcs } = context
    const p = player.computed
    let isTargetDead = false

    console.log(`\n⚔️  당신의 공격!`)

    // 1. 플레이어 본체 공격
    if (npcs.getNPC(target.id)) {
      const result = npcs.takeDamage(target.id, p.atk)
      isTargetDead = result.isDead
    } else {
      const damage = Math.max(p.atk - target.def, 1)
      target.hp -= damage
      console.log(`${target.name}에게 ${damage} 데미지 (남은 HP: ${Math.max(0, target.hp)})`)
      if (target.hp <= 0) isTargetDead = true
    }

    // 2. 소환수(스켈레톤)들의 합동 공격 (타겟이 살아있을 경우에만)
    if (!isTargetDead && player.skeleton.length > 0) {
      console.log(`\n💀 소환수들이 일제히 달려듭니다!`)
      for (const minion of player.skeleton) {
        if (isTargetDead) break; // 공격 도중 죽으면 중단

        const mDamage = Math.max(minion.atk - target.def, 1)
        target.hp -= mDamage
        console.log(`🦴 ${minion.name}의 공격! ${mDamage} 데미지 (남은 HP: ${Math.max(0, target.hp)})`)
        
        if (target.hp <= 0) {
          isTargetDead = true
          console.log(`💀 ${target.name}이(가) 소환수들의 공격에 쓰러졌습니다.`)
        }
      }
    }

    // 3. 반격 처리 (주 타겟이 죽었더라도 주변 동료가 있다면 실행됨)
    this.executeGroupCounter(player, context, isTargetDead, target)

    return isTargetDead
  }

  /**
   * 타일에 존재하는 모든 적(NPC 포함)의 연쇄 반격
   */
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
    });

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
      } 
      else {
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