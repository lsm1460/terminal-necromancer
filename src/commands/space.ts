import enquirer from 'enquirer'
import { Logger } from '~/core/Logger'
import { Player } from '~/core/player/Player'
import { BattleTarget, CommandFunction } from '~/types'

export const spaceCommand: CommandFunction = async (player, args, context) => {
  const { events } = context

  // 1. 권능 획득 여부 및 상태 메시지 설정
  const caronIsMine = events.isCompleted('caron_is_mine')
  const caronIsDead = events.isCompleted('caron_is_dead')

  if (!caronIsMine && !caronIsDead) {
    Logger.log('\n(아공간의 권능을 소유하고 있지 않습니다.)')
    return false
  }

  if (caronIsMine) {
    Logger.log('\n카론: "(그림자 속에서 나직이 읊조리며) 차원의 문을 열겠습니다. 당신의 군세를 이곳에 맡기시지요."')
  } else {
    Logger.log('\n[ 찬탈한 아공간의 틈새가 비정상적인 냉기를 뿜으며 뒤틀립니다. ]')
  }

  // 2. 가용 동작 판단
  const canPush = player.skeleton.length > 0 && player.skeletonSubspace.length < player.subspaceLimit
  const canPull = player.skeletonSubspace.length > 0

  const actionChoices = []
  if (canPush) actionChoices.push({ name: 'push', message: '📥 넣기 (필드 -> 아공간)' })
  if (canPull) actionChoices.push({ name: 'pull', message: '📤 꺼내기 / 교체 (아공간 -> 필드)' })
  actionChoices.push({ name: 'cancel', message: '🔙 취소' })

  if (actionChoices.length === 1) {
    // 취소만 있는 경우
    Logger.log('\n(현재 조작할 수 있는 스켈레톤이 아공간이나 필드에 없습니다.)')
    return false
  }

  // 3. 메인 액션 선택
  const { action } = await enquirer.prompt<{ action: 'push' | 'pull' | 'cancel' }>({
    type: 'select',
    name: 'action',
    message: `[ 아공간 점유: ${player.skeletonSubspace.length}/${player.subspaceLimit} ]`,
    choices: actionChoices,
  })

  if (action === 'cancel') return false

  // 4. 로직 실행
  if (action === 'push') {
    await handlePush(player)
  } else {
    await handlePull(player)
  }

  return false
}

/** 필드 -> 아공간 이동 */
async function handlePush(player: Player) {
  const skeletonChoices = player.skeleton.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const { targetId } = await enquirer.prompt<{ targetId: string }>({
    type: 'select',
    name: 'targetId',
    message: '어떤 소환수를 아공간으로 보냅니까?',
    choices: skeletonChoices,
  })

  const target = player.skeleton.find((sk) => sk.id === targetId)
  if (!target) return

  player.skeleton = player.skeleton.filter((s) => s.id !== targetId)
  player.skeletonSubspace.push(target)
  Logger.log(`\n✨ [봉인] ${target.name}이(가) 차원의 틈새로 사라졌습니다.`)
}

/** 아공간 -> 필드 이동 (교체 로직 포함) */
/** 아공간 -> 필드 이동 결정 */
async function handlePull(player: Player) {
  const subspaceChoices = player.skeletonSubspace.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const { pullId } = await enquirer.prompt<{ pullId: string }>({
    type: 'select',
    name: 'pullId',
    message: '아공간에서 해방할 소환수를 선택하십시오.',
    choices: subspaceChoices,
  })

  const targetToPull = player.skeletonSubspace.find((sk) => sk.id === pullId)
  if (!targetToPull) return

  // 필드 제한 확인: 꽉 찼다면 Swap으로 넘김
  if (player.skeleton.length >= player.subspaceLimit) {
    await handleSwap(player, targetToPull)
  } else {
    // 단순 꺼내기 실행
    player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== pullId)
    player.skeleton.push(targetToPull)

    renderSuccessMessage(targetToPull.name, 'pull')
  }
}

/** 🔄 필드와 아공간의 스켈레톤 교체 */
async function handleSwap(player: Player, targetToPull: BattleTarget) {
  Logger.log('\n⚠️ 필드 수용량이 가득 찼습니다. 대상을 교체해야 합니다.')

  const fieldChoices = player.skeleton.map((sk) => ({
    name: sk.id,
    message: `${sk.name} (HP: ${sk.hp}/${sk.maxHp})`,
  }))

  const { pushId } = await enquirer.prompt<{ pushId: string }>({
    type: 'select',
    name: 'pushId',
    message: `[${targetToPull.name}] 대신 아공간으로 보낼 대상을 선택하십시오.`,
    choices: fieldChoices,
  })

  const targetToPush = player.skeleton.find((sk) => sk.id === pushId)
  if (!targetToPush) return

  // 데이터 교체
  player.skeleton = player.skeleton.filter((s) => s.id !== pushId)
  player.skeletonSubspace = player.skeletonSubspace.filter((s) => s.id !== targetToPull.id)

  player.skeleton.push(targetToPull)
  player.skeletonSubspace.push(targetToPush)

  renderSuccessMessage(`${targetToPush.name} ↔ ${targetToPull.name}`, 'swap')
}

/** 결과 메시지 출력용 헬퍼 함수 */
function renderSuccessMessage(name: string, type: 'push' | 'pull' | 'swap') {
  const messages = {
    push: `\n✨ [봉인] ${name}이(가) 차원의 틈새로 강제로 끌려들어갔습니다.`,
    pull: `\n💀 [해방] ${name}이(가) 지면에서 솟아오릅니다.`,
    swap: `\n🔄 [교체] ${name}의 위치가 아공간의 비틀림 속에서 뒤바뀌었습니다.`,
  }
  Logger.log(messages[type])
}
