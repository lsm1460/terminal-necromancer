import { GameContext } from '../../../types'
import { CombatUnit } from '../../Battle'
import { Player } from '../../Player'

/**
 * 영혼 흡수: 적 대상으로부터 정수를 추출하여 마나를 회복
 */
export const soulHarvest = (player: CombatUnit<Player>, context: GameContext, targetId: string): boolean => {
  const { world } = context
  const { x, y } = player.ref.pos

  // 1. 현재 위치의 시체 목록 가져오기
  const corpses = world.getCorpsesAt(x, y)

  // 2. 특정 시체 지정 또는 첫 번째 시체 선택
  const selectedCorpse = corpses.find((c) => c.id === targetId)

  if (!selectedCorpse) {
    console.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
    return false
  }

  // 2. 수치 결정
  const restoreAmount = 20 // 기본 마나 회복량

  // 3. 자원 회복 처리
  const previousMp = player.ref.mp
  player.ref.mp = Math.min(player.ref.maxMp, player.ref.mp + restoreAmount)
  const actualRestored = player.ref.mp - previousMp

  // 4. 결과 연출 로그
  if (actualRestored > 0) {
    console.log(`${selectedCorpse.name}에게서 영혼을 추출하여 마나를 ${actualRestored} 회복했습니다.`)
  } else {
    console.log('마나가 이미 가득 차 있습니다.')
  }

  // (선택) 회복 스킬이라도 적에게 아주 미미한 데미지나 경직을 줄 수 있습니다.
  // target.takeDamage(5);

  return true
}
