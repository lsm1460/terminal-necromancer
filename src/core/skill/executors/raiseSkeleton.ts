import { RARITY_DATA, SkeletonRarity } from '../../../consts'
import { BattleTarget, ExecuteSkill } from '../../../types'
import { SkillManager } from '../SkillManager'

export const raiseSkeleton: ExecuteSkill = async (player, context) => {
  const { world, npcs } = context
  const { x, y } = player.ref.pos

  // 1. 현재 위치의 시체 목록 가져오기
  const targetId = await SkillManager.selectCorpse(player.ref, context)

  const corpses = world.getCorpsesAt(x, y)

  // 2. 특정 시체 지정
  const selectedCorpse = corpses.find((c) => c.id === targetId)
  
  if (!selectedCorpse) {
    console.log('\n[실패] 주위에 이용할 수 있는 시체가 없습니다.')
    return {
      isSuccess: false,
      isAggressive: false,
      gross: 0,
    }
  }

  // --- 1. 등급 결정 로직 ---
  const rarities: SkeletonRarity[] = ['common', 'rare', 'elite', 'epic', 'legendary']
  // 시체에 저장된 최솟값 인덱스 (기본값 Rare)
  const minIdx = rarities.indexOf(selectedCorpse?.minRarity || 'common') + player.ref.getAffixValue('ELITE_SQUAD')

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

  const skeleton: BattleTarget = {
    id: `skeleton_${Date.now()}`,
    name: `[${finalRarity}] 스켈레톤 ${selectedClass.name}`,
    maxHp: Math.floor(selectedCorpse.maxHp * 0.5 * m * s.hp),
    hp: Math.floor(selectedCorpse.maxHp * 0.5 * m * s.hp),
    atk: Math.floor(selectedCorpse.atk * 0.8 * m * s.atk),
    def: Math.floor(selectedCorpse.def * 0.5 * m * s.def),
    agi: Math.floor(selectedCorpse.agi * 0.5 * m * s.agi),
    skills: [...selectedClass.skills],
    exp: 0,
    description: `${selectedCorpse.name}의 유골로 만들어진 소환수입니다.`,
    dropTableId: '',
    encounterRate: 0,
    isAlive: true,
    isMinion: true,
  }

  // 4. 플레이어에게 추가 및 세계에서 시체 제거
  if (player.ref.addSkeleton(skeleton)) {
    world.removeCorpse(selectedCorpse.id)

    npcs.reborn(selectedCorpse.id)

    console.log(`\n[강령술] ${selectedCorpse.name}의 뼈가 맞춰지며 일어섭니다!`)
    console.log(`${finalRarity} 등급의 스켈레톤 ${selectedClass.name}으로 부활했습니다! 💀`)
    return {
      isSuccess: true,
      isAggressive: false,
      gross: 20,
    }
  } else {
    console.log('\n[알림] 더 이상 해골병사를 부릴 수 없습니다.')
  }

  return {
    isSuccess: false,
    isAggressive: false,
    gross: 0,
  }
}
