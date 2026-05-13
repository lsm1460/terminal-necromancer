import { MAP_IDS } from '~/consts'
import { Player } from '~/core/player/Player'
import { IMapManager, Skill } from '~/core/types'
import i18n from '~/i18n'
import { getPlayerSkills } from '~/systems/skill/player'
import { SkillId } from '~/types'

export const ElevatorService = {
  getAvailableDestinations(mapManager: IMapManager, currentSceneId: string, completedEvents: string[]) {
    const destinations = Object.entries(MAP_IDS)
      .filter(([_, value]) => value !== currentSceneId)
      .map(([_, value]) => {
        const isUnlocked = mapManager.isUnlocked(value, completedEvents)
        const mapData = mapManager.getMap(value)

        return {
          name: value as string,
          message: isUnlocked ? `🛗 ${i18n.t(`scene.${mapData.id}`)}` : '???',
          disabled: !isUnlocked,
          isUnlocked,
        }
      })

    const isAllHidden = destinations.every((d) => !d.isUnlocked)

    return {
      destinations,
      isAllHidden,
    } as {
      destinations: { name: string; message: string }[]
      isAllHidden: boolean
    }
  },

  getMemorizeChoices(player: Player) {
    const playerSkills = getPlayerSkills()

    return player.unlockedSkills
      .map((id) => (playerSkills as any)[id])
      .filter(Boolean)
      .map((s: Skill) => ({
        name: s.name,
        message: i18n.t('npc.elevator.memorize.skill_format', {
          name: s.name.padEnd(12),
          cost: String(s.cost).padStart(2),
          description: s.description,
        }),
      }))
  },

  getSkillIdByName(name: string) {
    const playerSkills = getPlayerSkills()
    const entry = Object.entries(playerSkills).find(([, s]) => s.name === name)
    return entry![0] as SkillId
  },
}
