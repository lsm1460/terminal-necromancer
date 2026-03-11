import { CombatUnit } from '~/core/battle/unit/CombatUnit'
import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import { ItemType, NpcSkill } from '~/types'

export const SpecialSkillLogics: Record<
  string,
  (attacker: CombatUnit, targets: CombatUnit[], skill: NpcSkill) => Promise<void>
> = {
  // 자폭
  self_destruct: async (attacker, targets, skill) => {
    // 1. 모든 대상에게 데미지 적용
    for (const target of targets) {
      await target.executeHit(attacker, {
        attackType: 'explode',
        rawDamage: Math.floor(attacker.ref.hp * skill.power),
      })
    }
    // 2. 시전자 즉사 처리
    Terminal.log(`💀 ${attacker.name}(은)는 모든 힘을 쏟아내고 소멸했습니다!`)

    attacker.dead()
  },

  health_drain: async (attacker, targets, skill) => {
    let totalDamageDealt = 0

    for (const target of targets) {
      const result = await target.executeHit(attacker, {
        skillAtkMult: skill.power,
        attackType: skill.attackType,
      })

      totalDamageDealt += result.damage || 0
    }

    const healAmount = Math.ceil(totalDamageDealt * 0.5)
    if (healAmount > 0) {
      attacker.ref.hp = Math.min(attacker.ref.maxHp, attacker.ref.hp + healAmount)
      Terminal.log(`💉 ${attacker.name}(이)가 적의 생명력을 흡수하여 HP를 ${healAmount}만큼 회복했습니다!`)
    }
  },
  item_steal: async (attacker, targets, skill) => {
    for (const target of targets) {
      await target.executeHit(attacker, {
        skillAtkMult: skill.power,
        attackType: skill.attackType,
      })

      if (target.type !== 'player') {
        Terminal.log(` > ${target.name}(은)는 훔칠 물건이 없습니다.`)
        continue
      }

      const player = target.ref as Player

      const isGoldSteal = Math.random() < 0.5

      const stealableCandidates = player.inventory.filter((item) => item.type !== ItemType.QUEST) || []

      if (isGoldSteal && player.gold > 0) {
        // 골드 탈취: 고정 수치와 비율 중 작은 값을 선택해 파산 방지
        const stealAmount = Math.min(player.gold, Math.floor(10 + player.gold * 0.05))
        player.gold -= stealAmount
        Terminal.log(
          ` \x1b[33m[!] 소매치기!\x1b[0m ${attacker.name}(이)가 \x1b[33m${stealAmount}G\x1b[0m를 훔쳐 달아납니다!`
        )
      } else if (stealableCandidates.length > 0) {
        // 3. 필터링된 후보 중에서만 랜덤 선택
        const targetItem = stealableCandidates[Math.floor(Math.random() * stealableCandidates.length)]

        // 실제 인벤토리에서 해당 아이템의 인덱스를 찾아 제거
        const actualItem = player.inventory.find((item) => item === targetItem)
        if (actualItem) {
          player.removeItem(actualItem.id, 1)
          Terminal.log(
            ` \x1b[31m[!] 분실!\x1b[0m ${attacker.name}(이)가 배낭에서 \x1b[90m'${targetItem.label}'\x1b[0m을(를) 훔쳐 달아납니다!`
          )
        }
      } else {
        // 훔칠 골드도 없고, 훔칠 수 있는 일반 아이템도 없을 때
        Terminal.log(` > ${attacker.name}(이)가 당신의 주머니를 뒤졌지만, 땡전 한 푼 나오지 않습니다.`)
      }
    }
  },
}
