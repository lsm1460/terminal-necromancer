import enquirer from 'enquirer'
import { ExecuteSkill } from '../../../types'

export const recallSkeleton: ExecuteSkill = async (player, context) => {
  const skeletons = player.ref.skeleton

  const { corpseId } = await enquirer.prompt<{ corpseId: string }>({
    type: 'select',
    name: 'corpseId',
    message: '어떤 시체를 소모하시겠습니까?',
    choices: [
      ...skeletons.map((s) => ({
        name: s.id,
        message: s.name,
      })),
      { name: 'cancel', message: '🔙 취소하기' },
    ],
    format(value) {
      if (value === 'cancel') return '취소됨'

      const target = skeletons.find((c, idx) => (c.id || idx.toString()) === value)
      return target ? `[${target.name}]` : value
    },
  })

  if (corpseId === 'cancel') {
    console.log('\n💬 스킬 사용을 취소했습니다.')
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  const selectedCorpse = skeletons.find((target) => target.id === corpseId)

  if (!selectedCorpse) {
    console.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  const skeleton = player.ref.skeleton.find((sk) => sk.id === selectedCorpse.id)
  if (skeleton) {
    skeleton.hp = 0
    skeleton.isAlive = false
  }

  player.ref.removeMinion(selectedCorpse.id)

  player.ref.mp = Math.min(player.ref.mp + 5, player.ref.maxMp) 

  console.log(
    `[역소환 성공] ${selectedCorpse.name || '스켈레톤'} 이(가) 영혼으로 환원되었습니다.`
  );
  console.log(
    `[자원 회수] 마나 +5 회복 | 현재 마나: ${player.ref.mp}`
  );

  return {
    isSuccess: true,
    isAggressive: false,
    gross: 30,
  }
}
