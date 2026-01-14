import { Player } from '../core/Player'
import { printTileStatus } from '../statusPrinter'
import { BattleTarget, CommandFunction, Drop, ItemType, Monster } from '../types'

export const statusCommand: CommandFunction = (player, args, context) => {
  const {atk: originAtk, def: originDef, skeleton, maxSkeleton} = player
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
  }

  let armorText = '없음'
  if (equipped.armor && equipped.armor.type === ItemType.ARMOR) {
    const { def, label } = equipped.armor

    armorText = `${label} (방어 +${def})`
  }

  console.log(`무기: ${weaponText}`)
  console.log(`방어구: ${armorText}`)

  console.log('\n💀 [ 소환수 군단 상태 ]')
  console.log(` └ 💀 해골 병사: ${skeleton.length} / ${maxSkeleton}`);

  if (player.minions.length === 0) {
    console.log('   (현재 소환된 미니언이 없습니다.)')
  } else {
    player.minions.forEach(printMinion)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return false
}

const printMinion = (minion: BattleTarget, index?: number) => {
  const hpPercent = Math.max(0, (minion.hp / minion.maxHp) * 10)
  const hpBar = '■'.repeat(Math.floor(hpPercent)) + '□'.repeat(10 - Math.floor(hpPercent))
  const statusIcon = minion.isAlive ? '🟢' : '🔴'

  // index가 있으면 번호를 붙이고, 없으면 생략
  const prefix = index !== undefined ? `${index + 1}. ` : ''

  console.log(
    `   ${prefix}[${minion.name}] ${statusIcon}\n` +
      `      HP: ${hpBar} (${minion.hp}/${minion.maxHp})\n` +
      `      ATK: ${minion.atk} | AGI: ${minion.agi}`
  )
}

const lookAll = (player: Player, items: Drop[], monsters?: Monster[]) => {
  const entities: string[] = []

  if (monsters) {
    monsters
      .filter((_monster) => _monster.isAlive)
      .forEach((_monster) => {
        entities.push(_monster.name)
      })
  }

  const itemCounts: Record<string, number> = {}
  items.forEach((item) => {
    const qty = item.quantity ?? 1
    itemCounts[item.label] = (itemCounts[item.label] || 0) + qty
  })

  player.minions.forEach((minion) => {
    entities.push(minion.name)
  })

  Object.entries(itemCounts).forEach(([label, qty]) => {
    if (qty > 1) entities.push(`${label} ${qty}개`)
    else entities.push(label)
  })

  if (entities.length > 0) console.log(`주변에는 ${entities.join(', ')} 이(가) 있다.`)
  else console.log('주변에 몬스터나 아이템이 없습니다.')
}

const lookSomething = (name: string, items: Drop[], monsters?: BattleTarget[]) => {
  const filterName = name.toLowerCase()

  if (monsters) {
    const monster = monsters.find((_monster) => _monster.name === filterName)

    if (monster) {
      console.log(monster.description ?? monster.name)
      if (monster.isMinion) {
        printMinion(monster)
      }
      return
    }
  }

  const item = items.find((i) => i.label.toLowerCase() === filterName)
  if (item) {
    console.log(item.description ?? item.label)
    return
  }

  console.log('주변에 해당 이름의 몬스터나 아이템이 없습니다.')
}

// lookCommand에서는 args에 따라 호출
export const lookCommand: CommandFunction = (player, args, context) => {
  const { x, y } = player.pos
  const { map, world } = context
  const tile = map.getTile(x, y)

  const items = world.getDropsAt(x, y)

  if (!args[0]) {
    printTileStatus(player, context)

    lookAll(player, items, tile.monsters)
  } else {
    lookSomething(args[0], [...items, ...player.inventory] as Drop[], [...(tile.monsters || []), ...player.minions])
  }

  return false
}
