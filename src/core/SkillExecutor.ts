// core/SkillExecutor.ts
import { GameContext, Corpse, BattleTarget } from '../types'
import { Player } from './Player'

export class SkillExecutor {
  /**
   * 시체 살리기: 현재 칸의 시체를 소모하여 스켈레톤 생성
   */
  static raiseSkeleton(player: Player, context: GameContext, targetName?: string): boolean {
    const { world, npcs } = context
    const { x, y } = player.pos

    // 1. 현재 위치의 시체 목록 가져오기
    const corpses = world.getCorpsesAt(x, y)

    if (corpses.length === 0) {
      console.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
      return false
    }

    // 2. 특정 시체 지정 또는 첫 번째 시체 선택
    let selectedCorpse: Corpse | undefined
    if (targetName) {
      selectedCorpse = corpses.find((c) => c.name.includes(targetName))
    } else {
      selectedCorpse = corpses[0]
    }

    if (!selectedCorpse) {
      console.log(`\n[실패] '${targetName}'(이)라는 시체를 찾을 수 없습니다.`)
      return false
    }

    // 3. 스켈레톤 데이터 생성 (시체의 능력치에 비례하거나 고정값)
    const skeleton: BattleTarget = {
      id: `skeleton_${Date.now()}`,
      name: `스켈레톤(${selectedCorpse.name})`,
      hp: Math.floor(selectedCorpse.hp * 0.5) + 20,
      atk: Math.floor(selectedCorpse.atk * 0.8) + 5,
      def: Math.floor(selectedCorpse.def * 0.5),
      eva: 5,
      exp: 0,
      description: `${selectedCorpse.name}의 유골로 만들어진 소환수입니다.`,
      dropTableId: '',
      gold: 0,
      encounterRate: 0,
      isAlive: true,
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
