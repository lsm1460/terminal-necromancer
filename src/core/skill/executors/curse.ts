import { GameContext, SkillResult } from '../../../types'
import { CombatUnit } from '../../Battle'
import { Player } from '../../Player'
import enquirer from 'enquirer'

/**
 * 저주 (Curse)
 * : 1명을 선택하여 공격력 감소 [5% 나머지는 버림]를 3턴동안 부여
 */
export const curse = async (
  player: CombatUnit<Player>,
  context: GameContext,
  enemies: CombatUnit[] = []
): Promise<SkillResult> => {
  const duration = 3
  const aliveEnemies = enemies.filter((e) => e.ref.hp > 0)

  if (aliveEnemies.length === 0) {
    console.log('\n[실패] 저주를 걸 대상이 없습니다.')
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }

  // 1. 선택지 구성 (취소 옵션 및 이미 저주 상태인지 표시)
  const choices = [
    ...aliveEnemies.map((e) => {
      const isAlreadyCursed = e.deBuff.some((d) => d.name === '저주')
      return {
        name: e.id,
        message: e.name + (isAlreadyCursed ? ' (이미 저주 상태)' : ''),
        value: e.id,
        disabled: isAlreadyCursed // 이미 저주 상태면 선택 불가하게 설정 (기호에 따라 생략 가능)
      }
    }),
    { name: 'cancel', message: '↩ 뒤로 가기', value: 'cancel' }
  ]

  try {
    const response = await enquirer.prompt<{ targetId: string }>({
      type: 'select',
      name: 'targetId',
      message: '저주를 걸 대상을 선택하세요',
      choices: choices,
      format(value) {
        if (value === 'cancel') return '시전을 취소합니다.'
        const target = aliveEnemies.find(e => e.id === value)
        return target ? target.name : ''
      }
    })

    if (response.targetId === 'cancel') {
      return { isSuccess: false, isAggressive: false, gross: 0 }
    }

    const target = aliveEnemies.find((e) => e.id === response.targetId)
    if (!target) return { isSuccess: false, isAggressive: false, gross: 0 }

    // 2. 디버프 로직 실행
    const atkReduction = Math.floor(target.stats.atk * 0.05)

    console.log(`\n💀 ${player.name}이(가) ${target.name}에게 어두운 저주를 내립니다!`)

    target.deBuff.push({
      name: '저주',
      type: 'deBuff',
      atk: atkReduction,
      duration: duration + 1,
    })

    console.log(` └ [약화] ${target.name}의 공격력이 ${duration}턴 동안 ${atkReduction}만큼 감소합니다.`)

    return {
      isSuccess: true,
      isAggressive: true,
      gross: 90,
    }
  } catch (error) {
    return { isSuccess: false, isAggressive: false, gross: 0 }
  }
}