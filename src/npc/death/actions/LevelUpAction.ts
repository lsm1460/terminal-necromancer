import { Player } from '~/core/player/Player'
import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'

export const LevelUpActions = {
  async handleLevelUp(player: Player) {
    const { required: nextExp, toNext: cost } = player.expToNextLevel()
    Terminal.log(i18n.t('npc.death.level_up.current_souls', { exp: player.exp }))

    const proceed = await Terminal.confirm(i18n.t('npc.death.level_up.confirm_offer', { cost }))
    if (!proceed) {
      Terminal.log(i18n.t('npc.death.level_up.reject_coward'))
      return true
    }

    if (player.levelUp()) {
      Terminal.log(i18n.t('npc.death.level_up.success_msg', { level: player.level }))
    } else {
      Terminal.log(i18n.t('npc.death.level_up.fail_msg', { current: player.exp, required: nextExp }))
    }
    return true
  },
}
