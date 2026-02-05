import enquirer from 'enquirer'
import { CommandFunction } from '../types'
import { printEntity } from './overview'

export const spaceCommand: CommandFunction = async (player, args, context) => {
  const { events } = context

  // 1. 해금 조건 확인
  if (!events.isCompleted('second_boss')) {
    console.log('\n(아공간을 소유하고 있지 않습니다.)')
    return false
  }

  // 2. 가용 상태 확인 및 선택지 구성
  const canPush = player.skeleton.length > 0 && player.skeletonSubspace.length < player.subspaceLimit
  const canPull = player.skeletonSubspace.length > 0

  const actionChoices = []
  if (canPush) actionChoices.push({ name: 'push', message: '📥 넣기 (필드 -> 아공간)' })
  if (canPull) actionChoices.push({ name: 'pull', message: '📤 꺼내기 (아공간 -> 필드)' })

  // 아무것도 할 수 없는 상태라면 종료
  if (actionChoices.length === 0) {
    if (player.skeleton.length === 0 && player.skeletonSubspace.length === 0) {
      console.log('\n(관리할 스켈레톤이 없습니다. 먼저 소환을 진행하세요.)')
    } else if (player.skeletonSubspace.length >= player.subspaceLimit) {
      console.log('\n(아공간이 가득 찼고, 꺼낼 수 있는 스켈레톤도 없습니다.)')
    } else {
      console.log('\n(현재는 아공간을 조작할 수 있는 상태가 아닙니다.)')
    }
    return false
  }

  // 취소 버튼 추가
  actionChoices.push({ name: 'cancel', message: '🔙 취소' })

  // 3. 동작 선택
  const { action } = await enquirer.prompt<{ action: 'push' | 'pull' | 'cancel' }>({
    type: 'select',
    name: 'action',
    message: `[ 아공간 점유: ${player.skeletonSubspace.length}/${player.subspaceLimit} ] 무엇을 하시겠습니까?`,
    choices: actionChoices,
  })

  if (action === 'cancel') return false

  // 4. 대상 리스트 설정
  const isPush = action === 'push'
  const sourceList = isPush ? player.skeleton : player.skeletonSubspace

  // 5. 스켈레톤 선택 (name은 ID, message는 이름과 상태 표시)
  const skeletonChoices = sourceList.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const { targetId } = await enquirer.prompt<{ targetId: string }>({
    type: 'select',
    name: 'targetId',
    message: isPush ? '어떤 소환수를 아공간에 넣겠습니까?' : '어떤 소환수를 아공간에서 꺼내겠습니까?',
    choices: skeletonChoices,
  })

  const targetSkeleton = sourceList.find((sk) => sk.id === targetId)
  if (!targetSkeleton) return false

  // 6. 상세 정보 출력 및 최종 승인
  printEntity(targetSkeleton, context)

  const confirmMsg = isPush
    ? `[${targetSkeleton.name}]을(를) 아공간에 넣으시겠습니까?`
    : `[${targetSkeleton.name}]을(를) 현재 필드로 꺼내시겠습니까?`

  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: confirmMsg,
    initial: true,
  })

  if (!proceed) {
    console.log('\n(명령을 취소했습니다.)')
    return false
  }

  // 7. 데이터 이동 실행
  if (isPush) {
    player.skeleton = player.skeleton.filter((s) => s.id !== targetId)
    player.skeletonSubspace.push(targetSkeleton)
    console.log(`\n✨ [아공간 봉인] ${targetSkeleton.name}이(가) 차원의 틈새로 들어갔습니다.`)
  } else {
    player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== targetId)
    player.skeleton.push(targetSkeleton)
    console.log(`\n💀 [아공간 해방] ${targetSkeleton.name}이(가) 지면에서 솟아오릅니다.`)
  }

  return false
}
