import { RARITY_DATA, SkeletonRarity } from '../../../consts'
import { BattleTarget, Corpse, ExecuteSkill } from '../../../types'
import { SkillManager } from '../SkillManager'

export const raiseSkeleton: ExecuteSkill = async (player, context) => {
  const failure = {
    isSuccess: false,
    isAggressive: false,
    gross: 0,
  }
  const { world, npcs } = context
  const { x, y } = player.ref.pos

  const makeSkeleton = (corpse: Corpse, isMultiple?: boolean) => {
    // --- 1. 등급 결정 로직 ---
    const rarities: SkeletonRarity[] = ['common', 'rare', 'elite', 'epic', 'legendary']
    // 시체에 저장된 최솟값 인덱스 (기본값 Rare)
    const minIdx = rarities.indexOf(corpse?.minRarity || 'common') + player.ref.getAffixValue('ELITE_SQUAD')

    // 가중치 기반으로 랜덤 등급 선택
    const pool = rarities.slice(Math.min(minIdx, rarities.length - 1)) // 최소 등급 이상만 필터링
    const totalWeight = pool.reduce((sum, r) => sum + RARITY_DATA[r].weight, 0)
    let random = Math.random() * totalWeight

    let finalRarity = pool[0]
    for (const r of pool) {
      if (random < RARITY_DATA[r].weight) {
        finalRarity = r
        break
      }
      random -= RARITY_DATA[r].weight
    }

    const rarityInfo = RARITY_DATA[finalRarity]

    // 2. 해당 등급 내 서브 클래스 결정
    const totalSubWeight = rarityInfo.subClasses.reduce((sum, s) => sum + s.weight, 0)
    let subRandom = Math.random() * totalSubWeight
    let selectedClass = rarityInfo.subClasses[0]

    for (const sub of rarityInfo.subClasses) {
      if (subRandom < sub.weight) {
        selectedClass = sub
        break
      }
      subRandom -= sub.weight
    }

    // 3. 스켈레톤 데이터 생성 (시체의 능력치에 비례하거나 고정값)
    const m = rarityInfo.bonus
    const s = selectedClass.statMod

    const rarityColors: Record<SkeletonRarity, string> = {
      common: '\x1b[37m', // 하얀색
      rare: '\x1b[32m', // 초록색
      elite: '\x1b[34m', // 파란색
      epic: '\x1b[35m', // 보라색
      legendary: '\x1b[33m', // 노란색(금색)
    }

    const resetColor = '\x1b[0m'
    const color = rarityColors[finalRarity] || rarityColors.common
    const rarityTag = `${color}[${finalRarity.toUpperCase()}]${resetColor}`

    const skeleton: BattleTarget = {
      id: `skeleton_${Date.now()}`,
      name: `${rarityTag} 스켈레톤 ${selectedClass.name}`,
      rangeType: selectedClass.rangeType,
      maxHp: Math.floor(corpse.maxHp * 0.9 * m * s.hp),
      hp: Math.floor(corpse.maxHp * 0.9 * m * s.hp),
      atk: Math.floor(corpse.atk * 0.9 * m * s.atk),
      def: Math.floor(corpse.def * 0.9 * m * s.def),
      agi: Math.floor(corpse.agi * m * s.agi),
      skills: [...selectedClass.skills],
      exp: 0,
      description: `${corpse.name}의 유골로 만들어진 소환수입니다.`,
      dropTableId: '',
      encounterRate: 0,
      isAlive: true,
      isMinion: true,
      isSkeleton: true,
      orderWeight: selectedClass.orderWeight,
    }

    // 4. 플레이어에게 추가 및 세계에서 시체 제거
    if (player.ref.addSkeleton(skeleton)) {
      world.removeCorpse(corpse.id)

      npcs.reborn(corpse.id)

      console.log(`\n[강령술] ${corpse.name}의 뼈가 맞춰지며 일어섭니다!`)
      console.log(`💀 ${rarityTag} 등급의 스켈레톤 ${selectedClass.name}으로 부활했습니다!`)

      return true
    }

    !isMultiple && console.log('\n[알림] 더 이상 해골병사를 부릴 수 없습니다.')

    return false
  }

  const corpses = world.getCorpsesAt(x, y)

  if (corpses.length === 0) {
    console.log('🌑 주위에 부름에 응답할 시체가 존재하지 않습니다. 정적만이 감돕니다.')

    return { ...failure }
  }

  if (player.ref.skeleton.length >= player.ref.maxSkeleton) {
    // 2. 이미 최대 소환 수에 도달했을 때
    console.log('⚠️ 지배할 수 있는 영혼의 그릇이 가득 찼습니다. 더 이상 군단을 부릴 수 없습니다.')

    return { ...failure }
  }

  let isSuccess = false

  if (player.ref.hasAffix('LEGION')) {
    console.log('💀 군단의 인장이 붉게 타오르며, 대지의 모든 유골이 동시에 진동합니다!')

    isSuccess = corpses.map((_corpse) => makeSkeleton(_corpse, true)).some(Boolean)

    isSuccess && console.log('⚔️ 대강령 완료: 전율하는 뼈의 군세가 지옥의 부름에 응답해 일어섰습니다.')
  } else {
    // 1. 현재 위치의 시체 목록 가져오기
    const targetId = await SkillManager.selectCorpse(player.ref, context)

    // 2. 특정 시체 지정
    const selectedCorpse = corpses.find((c) => c.id === targetId)

    if (!selectedCorpse) {
      console.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
      return { ...failure }
    }

    isSuccess = makeSkeleton(selectedCorpse)
  }

  if (isSuccess) {
    return {
      isSuccess: true,
      isAggressive: false,
      gross: 20,
    }
  }

  return { ...failure }
}
