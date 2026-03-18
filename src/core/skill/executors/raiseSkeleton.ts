import { RARITY_DATA, SkeletonRarity } from '~/consts'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { BattleTarget, Corpse, ExecuteSkill } from '~/types'
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
    const minIdx = rarities.indexOf(corpse?.minRebornRarity || 'common') + player.ref.minRebornRarity

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
      id: `${selectedClass.id}::${Date.now()}`,
      name: `${rarityTag} skeleton ${selectedClass.name}`,
      attackType: selectedClass.attackType,
      maxHp: Math.floor(corpse.maxHp * 0.8 * m * s.hp),
      hp: Math.floor(corpse.maxHp * 0.8 * m * s.hp),
      atk: Math.max(Math.floor(corpse.atk * m * s.atk), 8),
      def: Math.max(Math.floor(corpse.def * m * s.def), 5),
      agi: Math.floor(corpse.agi * m * s.agi),
      skills: [...selectedClass.skills],
      exp: 0,
      description: i18n.t('npc.skeleton.description', { name: corpse.name }),
      originId: corpse.id,
      rarity: finalRarity,
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

      
      Terminal.log(i18n.t('skill.RAISE_SKELETON.reborn_start', { name: corpse.name }))
      Terminal.log(
        i18n.t('skill.RAISE_SKELETON.reborn_success', {
          rarity: rarityTag,
          class: i18n.t(`npc.${selectedClass.id}.name`),
        })
      )

      return true
    }

    if (!isMultiple) {
      Terminal.log(i18n.t('skill.RAISE_SKELETON.notice_limit'))
    }

    return false
  }

  const corpses = world.getCorpsesAt(x, y)

  if (corpses.length === 0) {
    Terminal.log(i18n.t('skill.RAISE_SKELETON.no_corpse'))
    return { ...failure }
  }

  if (player.ref.skeleton.length >= player.ref.maxSkeleton) {
    Terminal.log(i18n.t('skill.RAISE_SKELETON.limit_reached'))
    return { ...failure }
  }

  let isSuccess = false

  if (player.ref.hasAffix('LEGION')) {
    Terminal.log(i18n.t('skill.RAISE_SKELETON.legion_activation'))

    isSuccess = corpses.map((_corpse) => makeSkeleton(_corpse, true)).some(Boolean)

    if (isSuccess) {
      Terminal.log(i18n.t('skill.RAISE_SKELETON.legion_success'))
    }
  } else {
    const targetId = await SkillManager.selectCorpse(player.ref, context)
    const selectedCorpse = corpses.find((c) => c.id === targetId)

    if (!selectedCorpse) {
      Terminal.log(i18n.t('skill.not_found'))
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
