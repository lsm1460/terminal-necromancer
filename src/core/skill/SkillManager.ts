import enquirer from 'enquirer'
import { GameContext, SKILL_IDS, SkillId } from '../../types'
import { Player } from '../Player'
import { SKILL_LIST } from './skill'

export class SkillManager {
  static async requestAndExecuteSkill(player: Player, context: GameContext): Promise<boolean> {
    const { world } = context
    const { x, y } = player.pos

    // 1. 가능 스킬 필터링
    const availableSkills = Object.values(SKILL_LIST).filter((skill) => player.hasSkill(skill.id))

    // 2. 스킬 선택 UI
    const { skillId } = await enquirer.prompt<{ skillId: string }>({
      type: 'select',
      name: 'skillId',
      message: `스킬 선택 (현재 MP: ${player.mp})`,
      choices: [
        ...availableSkills.map((s) => ({
          name: s.id,
          message: `${s.name} (MP: ${s.cost}) - ${s.description}`,
        })),
        { name: 'cancel', message: '🔙 취소하기' },
      ],
      format(value) {
        if (value === 'cancel') return '취소됨'
        const selected = availableSkills.find((s) => s.id === value)
        return selected ? `[${selected.name}]` : value
      },
    })

    if (skillId === 'cancel') return false

    const targetSkill = SKILL_LIST[skillId as SkillId]

    // 3. 자원 체크
    if (player.mp < targetSkill.cost) {
      console.log(`\n🚫 마력이 부족합니다! (필요: ${targetSkill.cost} / 현재: ${player.mp})`)
      return false
    }

    let selectedCorpseId: string | undefined
    const needCorpse = [SKILL_IDS.RAISE_SKELETON, SKILL_IDS.CORPSE_EXPLOSION, SKILL_IDS.SOUL_HARVEST].includes(
      skillId as SkillId
    )

    if (needCorpse) {
      const corpses = world.getCorpsesAt(x, y)
      if (corpses.length === 0) {
        console.log('\n💬 주변에 활용할 시체가 없습니다.')
        return false
      }

      const corpseChoices = [
        ...corpses.map((c, index) => ({
          name: c.id || index.toString(),
          message: `${c.name}의 시체`,
        })),
        { name: 'cancel', message: '🔙 취소하기' },
      ]

      const { corpseId } = await enquirer.prompt<{ corpseId: string }>({
        type: 'select',
        name: 'corpseId',
        message: '어떤 시체를 소모하시겠습니까?',
        choices: corpseChoices,
        format(value) {
          if (value === 'cancel') return '취소됨'

          const target = corpses.find((c, idx) => (c.id || idx.toString()) === value)
          return target ? `[${target.name}]` : value
        },
      })

      if (corpseId === 'cancel') {
        console.log('\n💬 스킬 사용을 취소했습니다.')
        return false
      }

      selectedCorpseId = corpseId
    }

    if (!selectedCorpseId) {
      return false
    }

    // 5. 실행 및 마력 소모
    targetSkill.execute(player, context, [selectedCorpseId])
    player.mp -= targetSkill.cost

    return true
  }
}
