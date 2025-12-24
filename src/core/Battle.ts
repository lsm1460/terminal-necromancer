import { Player } from './Player'
import { BattleTarget, GameContext } from '../types'

export class Battle {
  /**
   * 공격 로직 수행 (NPCManager 및 집단 반격 연동)
   * @returns {boolean} 주 타겟의 사망 여부 (보상 처리를 위해 반환)
   */
  static attack(player: Player, target: BattleTarget, context: GameContext): boolean {
    const { npcs } = context
    const p = player.computed
    let isTargetDead = false

    console.log(`\n⚔️  당신의 공격!`)

    // 1. 주 타겟 데미지 처리
    if (npcs.getNPC(target.id)) {
      // 대상이 NPC인 경우
      const result = npcs.takeDamage(target.id, p.atk)
      isTargetDead = result.isDead
    } else {
      // 대상이 일반 몬스터인 경우
      const damage = Math.max(p.atk - target.def, 1)
      target.hp -= damage
      console.log(`${target.name}에게 ${damage} 데미지 (남은 HP: ${Math.max(0, target.hp)})`)
      if (target.hp <= 0) isTargetDead = true
    }

    // 2. 주 타겟 사망 시 보상 처리를 위해 여기서 반환하지 않고,
    // 살아있는 다른 적들의 '집단 반격'을 먼저 처리합니다.
    isTargetDead = this.executeGroupCounter(player, context, isTargetDead, target)

    return isTargetDead // 최종적으로 타겟이 죽었는지만 알려줌
  }

  /**
   * 타일에 존재하는 모든 적(NPC 포함)의 연쇄 반격
   */
  static executeGroupCounter(
    player: Player,
    context: GameContext,
    isPrimaryDead?: boolean,
    primaryTarget?: BattleTarget
  ) {
    const tile = context.map.getTile(player.pos.x, player.pos.y)
    const enemies: BattleTarget[] = []

    // 반격 리스트 구성
    if (!isPrimaryDead && primaryTarget) enemies.push(primaryTarget)

    // 타일에 있는 다른 '적대적' NPC 추가
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
      // 플레이어 회피 판정 (플레이어의 eva 스탯 사용)
      // if (Math.random() * 100 < player.computed.eva) {
      //   console.log(`💨 ${enemy.name}의 공격을 가볍게 피했습니다!`);
      //   continue;
      // }

      const counterDmg = this.calculateDamage(player, enemy)
      const isPlayerDead = player.damage(counterDmg)

      console.log(`🏹 ${enemy.name}의 반격! ${counterDmg} 피해`)

      if (isPlayerDead) {
        console.log('💀 당신은 무릎을 꿇었습니다...')
        return true
      }
    }

    if (player.hp > 0) {
      console.log(`🩸 남은 HP: ${player.hp}`)
    }

    return false
  }

  static calculateDamage(player: Player, target: BattleTarget) {
    return Math.max(target.atk - player.computed.def, 1)
  }
}
