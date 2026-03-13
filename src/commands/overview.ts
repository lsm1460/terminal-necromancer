import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import GolemWrapper from '~/core/player/GolemWrapper'
import { Player } from '~/core/player/Player'
import i18n from '~/i18n'
import { printStatus } from '~/statusPrinter'
import { BattleTarget, CommandFunction, Corpse, Drop, GameContext, Item, ItemType, Monster, NPC, Tile } from '~/types'
import { getItemLabel, makeItemMessage } from '~/utils'

export const statusCommand: CommandFunction = (player, args, context) => {
  const { atk: originAtk, def: originDef, skeleton, maxSkeleton } = player
  const { atk, def, crit, eva, hp, mp, maxHp, maxMp, gold, level, exp, equipped } = player.computed

  Terminal.log(i18n.t('commands.look.status.title'))
  Terminal.log(i18n.t('commands.look.status.level', { level, exp }))

  const { required: expNeeded } = player.expToNextLevel()
  if (expNeeded !== null) {
    Terminal.log(i18n.t('commands.look.status.exp_next', { expNeeded }))
  } else {
    Terminal.log(i18n.t('commands.look.status.max_level'))
  }

  Terminal.log(i18n.t('commands.look.status.hp', { hp, maxHp }))
  Terminal.log(i18n.t('commands.look.status.mp', { mp, maxMp }))
  Terminal.log(i18n.t('commands.look.status.atk', { atk, bonus: atk - originAtk }))
  Terminal.log(i18n.t('commands.look.status.def', { def, bonus: def - originDef }))
  Terminal.log(i18n.t('commands.look.status.gold', { gold }))

  Terminal.log(i18n.t('commands.look.status.crit', { val: Math.floor(crit * 100) }))
  Terminal.log(i18n.t('commands.look.status.eva', { val: Math.floor(eva * 100) }))

  // 무기 정보 처리
  let weaponText = i18n.t('commands.look.status.equipment.none')
  if (equipped.weapon && equipped.weapon.type === ItemType.WEAPON) {
    weaponText = i18n.t('commands.look.status.equipment.bonus_atk', {
      label: getItemLabel(equipped.weapon),
      atk: equipped.weapon.atk,
    })

    if ('affix' in equipped.weapon && equipped.weapon.affix) {
      weaponText += i18n.t('commands.look.status.equipment.affix', {
        name: equipped.weapon.affix.name,
        description: equipped.weapon.affix.description,
      })
    }
  }

  // 방어구 정보 처리
  let armorText = i18n.t('commands.look.status.equipment.none')
  if (equipped.armor && equipped.armor.type === ItemType.ARMOR) {
    armorText = i18n.t('commands.look.status.equipment.bonus_def', {
      label: getItemLabel(equipped.armor),
      def: equipped.armor.def,
    })

    if ('affix' in equipped.armor && equipped.armor.affix) {
      armorText += i18n.t('commands.look.status.equipment.affix', {
        name: equipped.armor.affix.name,
        description: equipped.armor.affix.description,
      })
    }
  }

  Terminal.log(i18n.t('commands.look.status.equipment.weapon', { text: weaponText }))
  Terminal.log(i18n.t('commands.look.status.equipment.armor', { text: armorText }))

  // 소환수 군단 상태
  Terminal.log(i18n.t('commands.look.status.legion.title'))
  if (player.golem) {
    const golemStatus = player.golem.isAlive
      ? i18n.t('commands.look.status.legion.golem_status', { hp: player.golem.hp, maxHp: player.golem.maxHp })
      : i18n.t('commands.look.status.legion.golem_destroyed')

    const golemIcon = player.golem.isAlive ? '🤖' : '🛠️'
    Terminal.log(` └ ${golemIcon} ${player.golem.name}: ${golemStatus}`)
  }

  Terminal.log(i18n.t('commands.look.status.legion.skeleton', { count: skeleton.length, max: maxSkeleton }))

  if (player.minions.length === 0) {
    Terminal.log(i18n.t('commands.look.status.legion.no_minions'))
  }
  Terminal.log(i18n.t('commands.look.status.footer'))

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
  const {
    battle: { npcSkills },
  } = context

  const isMinion = target.isMinion
  const hpBar = renderHpBar(target.hp, target.maxHp)

  // 타입 태그 결정
  const typeTag = isMinion
    ? i18n.t('commands.look.entity.type_tag.minion')
    : i18n.t('commands.look.entity.type_tag.monster')

  // SKILL_LIST에서 실제 스킬 객체 로드
  const skillDetails = (target.skills || []).map((id) => npcSkills.getSkill(id)).filter(Boolean)

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(`${typeTag} ${target.name}`)
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  // 기본 스탯 출력
  Terminal.log(i18n.t('commands.look.entity.stats.hp', { hpBar, hp: target.hp, maxHp: target.maxHp }))
  Terminal.log(
    i18n.t('commands.look.entity.stats.combat', {
      atk: target.atk.toString().padEnd(3),
      def: target.def.toString().padEnd(3),
    })
  )

  // 부가 스탯 출력
  if (target.eva || target.crit) {
    Terminal.log(
      i18n.t('commands.look.entity.stats.sub', {
        eva: Math.floor((target.eva || 0) * 100),
        crit: Math.floor((target.crit || 0) * 100),
      })
    )
  }

  if (target.isGolem) {
    printGolem(target)
  }

  // 스킬 목록 출력
  if (skillDetails.length > 0) {
    Terminal.log(`──────────────────────────────────────────────`)
    Terminal.log(i18n.t('commands.look.entity.skills.label'))
    skillDetails.forEach((skill) => {
      Terminal.log(
        i18n.t('commands.look.entity.skills.item', {
          name: skill.name,
          description: skill.description,
        })
      )
    })
  }

  Terminal.log(`──────────────────────────────────────────────`)
  Terminal.log(` 💬 "${target.description}"`)
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

const printGolem = (target: BattleTarget) => {
  const golem = target as GolemWrapper
  const upgrades = golem.upgrade || []
  const limit = golem.upgradeLimit || 0
  const currentCount = upgrades.length

  Terminal.log(`──────────────────────────────────────────────`)
  const barLength = 10
  const filledLength = limit > 0 ? Math.round((currentCount / limit) * barLength) : 0
  const bar = '■'.repeat(filledLength) + '□'.repeat(Math.max(0, barLength - filledLength))

  // 성장도 로그 출력
  Terminal.log(
    i18n.t('commands.look.golem.growth_label', {
      bar,
      current: currentCount,
      limit,
    })
  )

  if (currentCount > 0) {
    const counts = _.countBy(upgrades)
    const machineLv = counts['machine'] || 0
    const soulLv = counts['soul'] || 0

    if (machineLv > 0) Terminal.log(i18n.t('commands.look.golem.upgrades.machine', { level: machineLv }))
    if (soulLv > 0) Terminal.log(i18n.t('commands.look.golem.upgrades.soul', { level: soulLv }))
  }
}

export const printItem = (item: Item) => {
  const rarityKey = item.rarity || 'COMMON'
  const rarityText = i18n.t(`commands.look.item.rarity.${rarityKey}`)

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(` ${rarityText} ${getItemLabel(item)} ${item.quantity ? `(x${item.quantity})` : ''}`)
  Terminal.log(`──────────────────────────────────────────────`)

  const stats: string[] = []
  if ('atk' in item) {
    stats.push(i18n.t('commands.look.item.stats.atk', { val: item.atk }))
    stats.push(i18n.t('commands.look.item.stats.crit', { val: item.crit * 100 }))
  }
  if ('def' in item) stats.push(i18n.t('commands.look.item.stats.def', { val: item.def }))
  if ('eva' in item && item.eva) stats.push(i18n.t('commands.look.item.stats.eva', { val: item.eva * 100 }))
  if ('hpHeal' in item) stats.push(i18n.t('commands.look.item.stats.hpHeal', { val: item.hpHeal }))

  if (stats.length > 0) Terminal.log(`${i18n.t('commands.look.item.stats.label')}${stats.join(' | ')}`)

  if ('mana' in item && item.mana) Terminal.log(i18n.t('commands.look.item.stats.mana', { val: item.mana }))
  if ('maxSkeleton' in item && item.maxSkeleton)
    Terminal.log(i18n.t('commands.look.item.stats.maxSkeleton', { val: item.maxSkeleton }))

  if ('affix' in item && item.affix) {
    Terminal.log(
      i18n.t('commands.look.item.stats.affix', {
        name: item.affix.name,
        description: item.affix.description,
      })
    )
  }

  const originId = item.id.split('::')[0]

  Terminal.log(`──────────────────────────────────────────────`)
  Terminal.log(` 📝 ${i18n.t(`item.${originId}.description`)}`)
  Terminal.log(
    i18n.t('commands.look.item.info.price', {
      price: item.price,
      sellPrice: item.sellPrice,
    })
  )
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

const selectTarget = async (subChoices: { name: string; message: string }[]) => {
  subChoices.push({ name: 'back', message: i18n.t('cancel') })

  return await Terminal.select(i18n.t('commands.look.select_target_prompt'), subChoices)
}

const lookBattleTarget = async (targets: BattleTarget[], context: GameContext) => {
  const subChoices = targets.map((t) => ({ name: t.id, message: `${t.name} (hp: ${t.hp}/${t.maxHp})` }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = targets.find((t) => t.id === selected)
    if (target) printEntity(target, context)
  }

  return selected
}

const lookItem = async (items: { label: string; qty: number; raw: any }[], player: Player) => {
  const subChoices = items.map((i) => ({
    name: i.label, // 아이템은 label을 식별자로 사용
    message: makeItemMessage(i.raw, player),
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = items.find((i) => i.label === selected)
    if (target) printItem(target.raw)
  }

  return selected
}

const lookPath = async (
  paths: {
    label: string
    tile: Tile | null
    canMove: boolean
  }[]
) => {
  const subChoices = paths.map((p) => ({
    name: p.label,
    message: p.label,
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = paths.find((p) => p.label === selected)
    if (target) {
      Terminal.log(i18n.t(`tiles.${target.tile?.id}.observe`))
      if (!target.tile?.isClear && target.tile?.event) {
        const eventId = target.tile.event

        if (eventId.includes('boss')) {
          Terminal.log(i18n.t('commands.look.path.danger_boss'))
        } else if (eventId.startsWith('monster')) {
          Terminal.log(i18n.t('commands.look.path.warning_monster'))
        }
      }
    }
  }

  return selected
}

const lookCorpse = async (corpse: Corpse[]) => {
  const subChoices = corpse.map((c) => ({
    name: c.id,
    message: i18n.t('commands.look.corpse.menu_label', { name: c.name }),
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = corpse.find((c) => c.id === selected)

    if (target) {
      const { name, maxHp, atk, def } = target

      // 상세 설명 로그
      Terminal.log(i18n.t('commands.look.corpse.description', { name }))

      // 능력치 정보 로그
      Terminal.log(i18n.t('commands.look.corpse.status_header', { name }))
      Terminal.log(i18n.t('commands.look.corpse.hp', { maxHp }))
      Terminal.log(i18n.t('commands.look.corpse.atk', { atk }))
      Terminal.log(i18n.t('commands.look.corpse.def', { def }))
      Terminal.log(i18n.t('commands.look.corpse.footer'))
    }
  }

  return selected
}

export const lookAll = async (
  player: Player,
  context: GameContext,
  items: Drop[],
  monsters?: Monster[]
): Promise<void> => {
  const { x, y } = player.pos
  const { map, npcs, world } = context
  const aliveMonsters = monsters?.filter((m) => m.isAlive) || []
  const minions = player.minions || []
  const tile = map.getTile(x, y)

  const aliveNPCs = (tile.npcIds || []).map((id) => npcs.getNPC(id)).filter((npc) => npc?.isAlive) as NPC[]
  const corpse = world.getCorpsesAt(x, y)

  // 아이템 수량 합산 처리
  const itemCounts: Record<string, { label: string; qty: number; raw: any }> = {}
  items.forEach((item) => {
    const label = getItemLabel(item)
    if (!itemCounts[label]) itemCounts[label] = { label: label, qty: 0, raw: item }
    itemCounts[label].qty += item.quantity || 1
  })
  const groupedItems = Object.values(itemCounts)

  // 1. 방향 데이터 정의 (설계의 확장성을 위해)
  const NAV_CONFIG = [
    { label: i18n.t('up'), dx: 0, dy: -1 },
    { label: i18n.t('down'), dx: 0, dy: 1 },
    { label: i18n.t('left'), dx: -1, dy: 0 },
    { label: i18n.t('right'), dx: 1, dy: 0 },
  ]

  // 2. 이동 가능한 타일 정보 추출 및 서사 생성
  const accessiblePaths = NAV_CONFIG.map(({ label, dx, dy }) => ({
    label,
    tile: map.getTile(x + dx, y + dy) as Tile | null,
    canMove: map.canMove(x + dx, y + dy),
  })).filter(({ canMove, tile }) => canMove && tile)

  const categoryChoices = [
    ...(accessiblePaths.length ? [{ name: 'PATH', message: i18n.t('commands.look.category.path') }] : []),
    ...(aliveNPCs.length ? [{ name: 'NPC', message: i18n.t('commands.look.category.npc') }] : []),
    ...(corpse.length ? [{ name: 'CORPSE', message: i18n.t('commands.look.category.corpse') }] : []),
    ...(aliveMonsters.length ? [{ name: 'MONSTER', message: i18n.t('commands.look.category.monster') }] : []),
    ...(minions.length ? [{ name: 'MINION', message: i18n.t('commands.look.category.minion') }] : []),
    ...(groupedItems.length ? [{ name: 'ITEM', message: i18n.t('commands.look.category.item') }] : []),
    { name: 'cancel', message: i18n.t('cancel') },
  ]

  // 1. 카테고리 선택
  const category = await Terminal.select(i18n.t('commands.look.select_prompt'), categoryChoices)

  if (category === 'cancel') return

  let targetId: string
  switch (category) {
    case 'MONSTER':
      targetId = await lookBattleTarget(aliveMonsters, context)
      break
    case 'MINION':
      targetId = await lookBattleTarget(minions, context)
      break
    case 'NPC':
      targetId = await lookBattleTarget(aliveNPCs, context)
      break
    case 'ITEM':
      targetId = await lookItem(groupedItems, player)
      break
    case 'PATH':
      targetId = await lookPath(accessiblePaths)
      break
    case 'CORPSE':
      targetId = await lookCorpse(corpse)
      break
    default:
      targetId = 'back'
      break
  }

  if (targetId === 'back') return await lookAll(player, context, items, monsters)

  //
}

// lookCommand에서는 args에 따라 호출
export const lookCommand: CommandFunction = async (player, args, context) => {
  const { x, y } = player.pos
  const { map, world } = context
  const tile = map.getTile(x, y)

  const items = world.getDropsAt(x, y)

  printStatus(player, context)

  await lookAll(player, context, items, tile.monsters)

  return false
}
