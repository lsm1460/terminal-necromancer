import enquirer from 'enquirer'
import { CombatUnit } from '../../Battle'
import { Player } from '../../Player'
import { GameContext, SkillResult } from '../../../types'

/**
 * 뼈 감옥 (Bone Prison)
 * : 대지에서 솟아오르는 뼈의 창살로 적 1명을 가둡니다.
 * : 대상에게 '뼈 감옥' [속박] 상태를 3턴 동안 부여합니다.
 */
export const bonePrison = async (
  player: CombatUnit<Player>,
  context: GameContext,
  enemies: CombatUnit[] = []
): Promise<SkillResult> => {
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  if (aliveEnemies.length === 0) {
    console.log('\n[실패] 감옥을 생성할 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 1. 대상 선택
  const choices = [
    ...aliveEnemies.map((e) => {
      const isAlreadyTrapped = e.deBuff.some((d) => d.name === '뼈 감옥')
      return {
        name: e.id,
        message: `${e.name}${isAlreadyTrapped ? ' (이미 갇힘)' : ''}`,
        value: e.id,
        disabled: isAlreadyTrapped,
      }
    }),
    { name: 'cancel', message: '🔙 취소하기', value: 'cancel' },
  ]

  const { targetId } = await enquirer.prompt<{ targetId: string }>({
    type: 'select',
    name: 'targetId',
    message: '뼈 감옥으로 가둘 대상을 선택하세요',
    choices: choices,
    format(value) {
      if (value === 'cancel') return '시전 취소'
      const target = aliveEnemies.find((e) => e.id === value)

      return target ? `${target.name}에게 뼈의 구속을...` : ''
    },
  })

  if (targetId === 'cancel') {
    console.log('\n💬 스킬 사용을 취소했습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  const target = aliveEnemies.find((e) => e.id === targetId)
  if (!target) {
    console.log('\n[실패] 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 2. 디버프 부여
  const duration = 3
  console.log(
    `\n💀 ${player.name}이(가) 차가운 마력을 뿜자, 거친 뼈 창살이 ${target.name}의 사지를 옥죄며 솟아오릅니다!`
  )

  target.deBuff.push({
    name: '뼈 감옥',
    type: 'bind',
    duration: duration + 1,
  })

  console.log(` └ [속박] ${target.name}이(가) ${duration}턴 동안 속박되었습니다.`)

  return {
    isSuccess: true,
    isAggressive: true,
    gross: 40,
  }
}
