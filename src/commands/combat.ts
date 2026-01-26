import enquirer from 'enquirer'
import { CombatUnit } from '../core/battle/CombatUnit'
import { CommandFunction, NPC } from '../types'

export const attackCommand: CommandFunction = async (player, args, context) => {
  const { map, npcs, battle } = context
  const tile = map.getTile(player.pos.x, player.pos.y)

  const warningMsg = `\n[!] 눈앞의 망자를 살해하시겠습니까? 한 번 휘두른 무기는 되돌릴 수 없습니다.`;

  if ((tile.npcIds || [])?.length > 0) {
    const { proceed } = await enquirer.prompt<{ proceed: boolean }>({
      type: 'confirm',
      name: 'proceed', // 반환 객체의 키값이 됩니다.
      message: warningMsg,
      initial: false, // 기본 선택값 (default 대신 initial 사용)
    })

    if (!proceed) {
      console.log(`\n당신은 살의를 거두고 무기를 내립니다.`);
      return false // 교체 중단
    }
  }

  const battleTargets = [
    ...(tile.monsters?.filter((m) => m.isAlive) || []).map((m) => battle.toCombatUnit(m, 'monster')),
    ...(tile.npcIds || [])
      .map((id) => context.npcs.getNPC(id)) // ID로 NPC 객체 조회
      .filter((npc): npc is NPC => !!npc && npc.isAlive && npc.faction !== 'untouchable')
      .map((n) => battle.toCombatUnit(n!, 'npc')),
  ] as CombatUnit[]

  // 2. 공격 대상이 없으면 종료
  if (battleTargets.length === 0) {
    console.log('\n[알림] 공격할 대상이 없습니다.')
    return false
  }

  // 3. 다대다 전투 루프(combatLoop) 진입
  tile.isClear = await battle.runCombatLoop(battleTargets, context)

  return false
}
