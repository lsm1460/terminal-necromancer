import enquirer from 'enquirer'
import { SKELETON_UPGRADE } from '../consts'
import { Player } from '../core/Player'
import { BattleTarget, GameContext } from '../types'
import { handleTalk, NPCHandler } from './NPCHandler'

const SubspaceHandler: NPCHandler = {
  getChoices(player, npc, context) {
    return [
      { name: 'talk', message: '💬 잡담' },
      { name: 'increaseLimit', message: '🦴 해골 군단 확장' },
      { name: 'space', message: '🌀 아공간' },
    ]
  },
  async handle(action, player, npc, context) {
    switch (action) {
      case 'talk':
        await handleTalk(npc)
        break
      case 'increaseLimit':
        await handleIncreaseLimit(player, context)
        break
      case 'space':
        await handleSpace(player, context)
        break
      default:
        break
    }
  },
}

async function handleIncreaseLimit(player: Player, context: GameContext) {
  const { events } = context
  const isMine = events.isCompleted('caron_is_mine')

  // --- 💬 카론/사역마 대사 모음 ---
  const scripts = isMine
    ? {
        max: '카론: "이미 현세의 물리적 한계에 도달하셨군요. 이 이상의 군세는 차원 자체가 버티지 못할 겁니다."',
        costInfo: `카론: "군주의 그릇을 넓히기 위해선 더 많은 영혼의 정수가 필요합니다."`,
        notEnough: '카론: "정수가 부족하군요. 영혼 조각을 더 거두어 오십시오."',
        confirm: '카론: "영혼의 족쇄를 풀어 과거의 위용을 되찾으시겠습니까?"',
        cancel: '카론: "현명한 신중함이십니다."',
        success: '카론: "느껴지는군요. 당신의 그림자가 한 층 더 깊어졌습니다. 더 많은 망자들이 당신을 따를 것입니다."',
      }
    : {
        max: '[아공간의 인도자]: "...한...계... 더...는... 불...가..."',
        costInfo: `[아공간의 인도자]: \"...영...혼... 바...쳐...라...\"`,
        notEnough: '[아공간의 인도자]: "...부...족... 영...혼... 더..."',
        confirm: '[아공간의 인도자]: "...해...방... 필..요..."',
        cancel: '[아공간의 인도자]: "...중...단..."',
        success: '[아공간의 인도자]: "...그...릇... 확..대... 군...세... 증...가..."',
      }

  const currentLimit = player._maxSkeleton || SKELETON_UPGRADE.MIN_LIMIT

  // 1. 최대치 도달 체크
  if (currentLimit >= SKELETON_UPGRADE.MAX_LIMIT) {
    console.log(`\n${scripts.max}`)
    return
  }

  const cost = SKELETON_UPGRADE.COSTS[currentLimit]

  console.log(`\n${scripts.costInfo}`)
  console.log(`현재 보유 영혼 조각: ${player.exp} / 필요 영혼 조각: ${cost}`)

  // 3. 경험치 부족 체크
  if (player.exp < cost) {
    console.log(`\n${scripts.notEnough}`)
    return
  }

  // 4. 확인 절차
  const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
    type: 'confirm',
    name: 'proceed',
    message: scripts.confirm,
    initial: false,
  })

  if (!proceed) {
    console.log(`\n${scripts.cancel}`)
    return
  }

  // 5. 실제 업데이트 로직
  player.exp -= cost
  player._maxSkeleton = currentLimit + 1

  console.log(`\n[💀 군단 규모 확장 완료]`)
  console.log(`${scripts.success}`)
  console.log(`스켈레톤 최대 보유 수: ${currentLimit} ➔ ${player._maxSkeleton}`)
}

async function handleSpace(player: Player, context: GameContext) {
  const { events } = context

  // 1. 권능 획득 여부 및 상태 메시지 설정
  const caronIsMine = events.isCompleted('caron_is_mine')

  if (caronIsMine) {
    console.log('\n카론: "(그림자 속에서 나직이 읊조리며) 차원의 문을 열겠습니다. 당신의 군세를 이곳에 맡기시지요."')
  } else {
    console.log('\n[ 찬탈한 아공간의 틈새가 비정상적인 냉기를 뿜으며 뒤틀립니다. ]')
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
    console.log('\n(현재 조작할 수 있는 스켈레톤이 아공간이나 필드에 없습니다.)')
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

  return
}

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
  console.log(`\n✨ [봉인] ${target.name}이(가) 차원의 틈새로 사라졌습니다.`)
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
  console.log('\n⚠️ 필드 수용량이 가득 찼습니다. 대상을 교체해야 합니다.')

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
  console.log(messages[type])
}

export default SubspaceHandler
