// core/SkillExecutor.ts
import { BattleTarget, GameContext } from '../../types'
import { Player } from '../Player'

export class SkillExecutor {
  /**
   * 시체 살리기: 현재 칸의 시체를 소모하여 스켈레톤 생성
   */
  static raiseSkeleton(player: Player, context: GameContext, targetId: string): boolean {
    const { world, npcs } = context
    const { x, y } = player.pos

    // 1. 현재 위치의 시체 목록 가져오기
    const corpses = world.getCorpsesAt(x, y)

    // 2. 특정 시체 지정 또는 첫 번째 시체 선택
    const selectedCorpse = corpses.find((c) => c.id === targetId)
    
    if (!selectedCorpse) {
      console.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
      return false
    }

    const maxHp = Math.floor(selectedCorpse.maxHp * 0.5)

    // 3. 스켈레톤 데이터 생성 (시체의 능력치에 비례하거나 고정값)
    const skeleton: BattleTarget = {
      id: `skeleton_${Date.now()}`,
      name: `스켈레톤(${selectedCorpse.name})`,
      maxHp,
      hp: maxHp,
      atk: Math.floor(selectedCorpse.atk * 0.8),
      def: Math.floor(selectedCorpse.def * 0.5),
      agi: Math.floor(selectedCorpse.agi * 0.5),
      exp: 0,
      description: `${selectedCorpse.name}의 유골로 만들어진 소환수입니다.`,
      dropTableId: '',
      encounterRate: 0,
      isAlive: true,
      isMinion: true
    }

    // 4. 플레이어에게 추가 및 세계에서 시체 제거
    if (player.addSkeleton(skeleton)) {
      world.removeCorpse(selectedCorpse.id)

      npcs.reborn(selectedCorpse.id)

      console.log(`\n[강령술] ${selectedCorpse.name}의 뼈가 맞춰지며 일어섭니다!`)
      return true
    } else {
      console.log('\n[알림] 더 이상 해골병사를 부릴 수 없습니다.')
    }

    return false
  }
}
