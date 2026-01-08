import { Battle } from '../core/Battle'
import { BattleTarget, CommandFunction, NPC } from '../types'

export const attackCommand: CommandFunction = async (player, args, context) => {
  const { map, npcs } = context
  const tile = map.getTile(player.pos.x, player.pos.y)
  const targetName = args[0]

  let battleTargets: BattleTarget[] = [] // 이번 전투에 참여할 적들

  // 1. 타겟 특정하기
  if (targetName) {
    // 이름을 입력한 경우: NPC 혹은 특정 몬스터 찾기
    const targetNPC = npcs.findNPC(tile.npcIds || [], targetName)
    const targetMonster = tile.monsters?.find((m) => m.name === targetName && m.isAlive)

    if (targetNPC && targetNPC.isAlive && targetNPC.faction !== 'untouchable') {
      // 2. 공격받은 대상이 NPC인 경우
      if (targetNPC.faction) {
        // 해당 타일의 모든 NPC 중에서 같은 팩션을 가진 살아있는 NPC들을 모두 모집
        const factionMembers = (tile.npcIds || [])
          .map((id) => npcs.getNPC(id)) // ID로 NPC 객체 가져오기
          .filter((n) => n && n.isAlive && n.faction === targetNPC.faction) as BattleTarget[]

        battleTargets.push(...factionMembers)

        console.log(`📢 ${targetNPC.faction} 소속원들이 ${targetNPC.name}을(를) 돕기 위해 무기를 듭니다!`)
      } else {
        // 소속이 없는 NPC라면 본인만 추가
        battleTargets.push(targetNPC)
      }
    } else if (targetMonster) {
      // 3. 몬스터인 경우 기존대로 본인만 추가
      battleTargets.push(targetMonster)
    }
  } else {
    // 이름이 없는 경우: 타일 내 모든 살아있는 몬스터를 적으로 간주
    battleTargets = [
      ...(tile.monsters?.filter((m) => m.isAlive) || []),
      ...(tile.npcIds || [])
        .map((id) => context.npcs.getNPC(id)) // ID로 NPC 객체 조회
        .filter((npc): npc is NPC => !!npc && npc.isAlive && npc.faction !== 'untouchable'),
    ]
  }

  // 2. 공격 대상이 없으면 종료
  if (battleTargets.length === 0) {
    console.log(targetName ? `\n[알림] '${targetName}'을(를) 찾을 수 없습니다.` : '\n[알림] 공격할 대상이 없습니다.')
    return false
  }

  // 3. 다대다 전투 루프(combatLoop) 진입
  await Battle.runCombatLoop(player, battleTargets, context)

  return false
}
