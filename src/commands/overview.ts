import enquirer from 'enquirer'
import { Player } from '../core/Player'
import { printTileStatus } from '../statusPrinter'
import {
  ArmorItem,
  BattleTarget,
  CommandFunction,
  ConsumableItem,
  Drop,
  FoodItem,
  GameContext,
  GenericItem,
  ItemType,
  Monster,
  Tile,
  WeaponItem,
} from '../types'

export const statusCommand: CommandFunction = (player, args, context) => {
  const { atk: originAtk, def: originDef, skeleton, maxSkeleton } = player
  const { atk, def, crit, eva, agi, hp, mp, maxHp, maxMp, gold, level, exp, equipped } = player.computed
  console.log('🛡️ 상태창')
  console.log(`레벨: ${level} (경험치: ${exp})`)

  const expNeeded = player.expToNextLevel()
  if (expNeeded !== null) {
    console.log(`다음 레벨까지 필요한 경험치: ${expNeeded}`)
  } else {
    console.log('최고 레벨입니다.')
  }

  console.log(`HP: ${hp} / ${maxHp}`)
  console.log(`MP: ${mp} / ${maxMp}`)
  console.log(`공격력: ${atk} (+ ${atk - originAtk})`)
  console.log(`방어력: ${def} (+ ${def - originDef})`)
  console.log(`골드: ${gold}`)

  console.log(`치명: ${Math.floor(crit * 100)}%`)
  console.log(`민첩: ${agi}`)
  console.log(`회피: ${Math.floor(eva * 100)}%`)

  // 장착 장비 출력 (타입 가드 + 구조 분해 활용)
  let weaponText = '없음'
  if (equipped.weapon && equipped.weapon.type === ItemType.WEAPON) {
    const { label, atk } = equipped.weapon
    weaponText = `${label} (공격 +${atk})`

    if ('affix' in equipped.weapon && equipped.weapon.affix) weaponText += `\n   ㄴ축복 : [${equipped.weapon.affix.name}] 효과 부여 (${equipped.weapon.affix.description})`
  }

  let armorText = '없음'
  if (equipped.armor && equipped.armor.type === ItemType.ARMOR) {
    const { def, label } = equipped.armor

    armorText = `${label} (방어 +${def})`

    if ('affix' in equipped.armor && equipped.armor.affix) armorText += `\n   ㄴ축복 : [${equipped.armor.affix.name}] 효과 부여 (${equipped.armor.affix.description})`
  }

  console.log(`무기: ${weaponText}`)
  console.log(`방어구: ${armorText}`)

  console.log('\n💀 [ 소환수 군단 상태 ]')
  console.log(` └ 💀 해골 병사: ${skeleton.length} / ${maxSkeleton}`)

  if (player.minions.length === 0) {
    console.log('   (현재 소환된 미니언이 없습니다.)')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return false
}

/**
 * [1] 엔티티 및 아이템 상세 정보 출력부 (View)
 */

// HP 바 렌더링 유틸리티
const renderHpBar = (hp: number, max: number) => {
  const size = 10
  const ratio = Math.max(0, Math.min(1, hp / max))
  const filled = Math.round(ratio * size)
  return `[${'■'.repeat(filled)}${'□'.repeat(size - filled)}]`
}

// 미니언 및 몬스터 정보 출력
export const printEntity = (target: BattleTarget, context: GameContext) => {
  const { npcSkills } = context
  const isMinion = target.isMinion
  const hpBar = renderHpBar(target.hp, target.maxHp)
  const typeTag = isMinion ? ' [🧟 MINION] ' : ' [💀 MONSTER] '

  // SKILL_LIST에서 실제 스킬 객체 로드
  const skillDetails = (target.skills || []).map((id) => npcSkills.getSkill(id)).filter(Boolean)

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`${typeTag} ${target.name}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(` HP  : ${hpBar} ${target.hp}/${target.maxHp}`)
  console.log(
    ` ATK : ${target.atk.toString().padEnd(3)} | DEF: ${target.def.toString().padEnd(3)} | AGI: ${target.agi}`
  )

  if (target.eva || target.crit) {
    console.log(
      ` SEC : 회피 ${Math.floor((target.eva || 0) * 100)}% | 크리티컬 ${Math.floor((target.crit || 0) * 100)}%`
    )
  }

  if (skillDetails.length > 0) {
    console.log(`──────────────────────────────────────────────`)
    console.log(` 보유 기술:`)
    skillDetails.forEach((skill) => {
      console.log(` • [${skill.name}]: ${skill.description}`)
    })
  }

  console.log(`──────────────────────────────────────────────`)
  console.log(` 💬 "${target.description}"`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// 아이템 정보 출력
export const printItem = (item: WeaponItem | ArmorItem | FoodItem | ConsumableItem | GenericItem) => {
  const rarityMap: Record<string, string> = {
    EPIC: '⟪🔮 에픽⟫',
    RARE: '⟪💎 희귀⟫',
    COMMON: '⟪⚪ 일반⟫',
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(` ${rarityMap[item.rarity || 'COMMON']} ${item.label} ${item.quantity ? `(x${item.quantity})` : ''}`)
  console.log(`──────────────────────────────────────────────`)

  const stats: string[] = []
  if ('atk' in item) stats.push(`공격력 +${item.atk}`, `치명타 ${item.crit}%`)
  if ('def' in item) stats.push(`방어력 +${item.def}`)
  if ('eva' in item && item.eva) stats.push(`회피율 +${item.eva}%`)
  if ('hpHeal' in item) stats.push(`즉시 회복 HP ${item.hpHeal}`)

  if (stats.length > 0) console.log(` 효과 : ${stats.join(' | ')}`)

  if ('maxSkeleton' in item && item.maxSkeleton) console.log(` 영령 : 최대 해골 소환수 +${item.maxSkeleton}`)
  if ('affix' in item && item.affix) console.log(` 축복 : [${item.affix.name}] 효과 부여 (${item.affix.description})`)

  console.log(`──────────────────────────────────────────────`)
  console.log(` 📝 ${item.description}`)
  console.log(` 💰 가치: ${item.price} G (판매가 ${item.sellPrice} G)`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

/**
 * [2] 주변 탐색 및 선택 로직 (Controller)
 */
export const lookAll = async (
  player: Player,
  context: GameContext,
  items: Drop[],
  monsters?: Monster[]
): Promise<void> => {
  const { x, y } = player.pos
  const { map } = context
  const aliveMonsters = monsters?.filter((m) => m.isAlive) || []
  const minions = player.minions || []

  // 아이템 수량 합산 처리
  const itemCounts: Record<string, { label: string; qty: number; raw: any }> = {}
  items.forEach((item) => {
    if (!itemCounts[item.label]) itemCounts[item.label] = { label: item.label, qty: 0, raw: item }
    itemCounts[item.label].qty += item.quantity || 1
  })
  const groupedItems = Object.values(itemCounts)

  // 1. 방향 데이터 정의 (설계의 확장성을 위해)
  const NAV_CONFIG = [
    { label: '위', dx: 0, dy: -1 },
    { label: '아래', dx: 0, dy: 1 },
    { label: '왼', dx: -1, dy: 0 },
    { label: '오른', dx: 1, dy: 0 },
  ]

  // 2. 이동 가능한 타일 정보 추출 및 서사 생성
  const accessiblePaths = NAV_CONFIG.map(({ label, dx, dy }) => ({
    label,
    tile: map.getTile(x + dx, y + dy) as Tile | null,
    canMove: map.canMove(x + dx, y + dy),
  })).filter(({ canMove, tile }) => canMove && tile)

  const categoryChoices = [
    ...(accessiblePaths.length ? [{ name: 'PATH', message: '🔍 주변 지형 살피기' }] : []),
    ...(aliveMonsters.length ? [{ name: 'MONSTER', message: '💀 적대적 생명체' }] : []),
    ...(minions.length ? [{ name: 'MINION', message: '🧟 소환된 미니언' }] : []),
    ...(groupedItems.length ? [{ name: 'ITEM', message: '💎 드롭된 아이템' }] : []),
    { name: 'cancel', message: '↩ 그만두기' },
  ]

  // 1. 카테고리 선택
  const { category } = await enquirer.prompt<{ category: string }>({
    type: 'select',
    name: 'category',
    message: '무엇을 확인하시겠습니까?',
    choices: categoryChoices,
    format(value) {
      if (value === 'cancel') return '취소'
      const target = categoryChoices.find((n) => n.name === value)

      return target ? target.message : value
    },
  })

  if (category === 'cancel') return

  // 2. 세부 대상 선택 (name은 ID, message는 표시용 이름)
  let subChoices: { name: string; message: string }[] = []

  if (category === 'MONSTER') {
    subChoices = aliveMonsters.map((m) => ({ name: m.id, message: m.name }))
  } else if (category === 'MINION') {
    subChoices = minions.map((m) => ({ name: m.id, message: m.name }))
  } else if (category === 'ITEM') {
    subChoices = groupedItems.map((i) => ({
      name: i.label, // 아이템은 label을 식별자로 사용
      message: i.qty > 1 ? `${i.label} (x${i.qty})` : i.label,
    }))
  } else if (category === 'PATH') {
    subChoices = accessiblePaths.map((p) => ({
      name: p.label,
      message: p.label + '쪽',
    }))
  }

  subChoices.push({ name: 'back', message: '↩ 뒤로 가기' })

  const { targetId } = await enquirer.prompt<{ targetId: string }>({
    type: 'select',
    name: 'targetId',
    message: '세부 대상을 선택하세요.',
    choices: subChoices,
    format(value) {
      if (value === 'back') return '↩ 뒤로 가기'
      const target = subChoices.find((n) => n.name === value)

      return target ? target.message : value
    },
  })

  if (targetId === 'back') return await lookAll(player, context, items, monsters)

  if (category === 'MONSTER') {
    const target = aliveMonsters.find((m) => m.id === targetId)
    if (target) printEntity(target, context)
  } else if (category === 'MINION') {
    const target = minions.find((m) => m.id === targetId)
    if (target) printEntity(target, context)
  } else if (category === 'ITEM') {
    const target = groupedItems.find((i) => i.label === targetId)
    if (target) printItem(target.raw)
  } else if (category === 'PATH') {
    const target = accessiblePaths.find((p) => p.label === targetId)
    if (target) {
      console.log(target.tile?.observe)
      if (!target.tile?.isClear && target.tile?.event) {
        const eventId = target.tile.event

        if (eventId.includes('boss')) {
          console.log(`\n[❗위험] 전방에 압도적인 존재감이 느껴집니다. 퇴로를 확인하십시오.`);
        } else if (eventId.startsWith('monster')) {
          console.log(`\n[⚠️ 주의] 전방에 적대적인 생명체의 살기가 느껴집니다.`);
        }
      }
    }
  }
}

// lookCommand에서는 args에 따라 호출
export const lookCommand: CommandFunction = async (player, args, context) => {
  const { x, y } = player.pos
  const { map, world } = context
  const tile = map.getTile(x, y)

  const items = world.getDropsAt(x, y)

  printTileStatus(player, context)

  await lookAll(player, context, items, tile.monsters)

  return false
}
