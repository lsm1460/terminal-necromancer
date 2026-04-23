import { createStatusCommand, ItemFormatterFn, StatusExtensionFn } from '~/commands/status'
import { Terminal } from '~/core/Terminal'
import { ICommandManager, ICommandSystem } from '~/core/types'
import i18n from '~/i18n'
import { AppContext } from '../types'
import { GameEquipAble } from '../item/GameEquipAble'

export class StatusSystem implements ICommandSystem {
  constructor(private context: AppContext) {}

  install(handler: ICommandManager) {
    handler.register('status', createStatusCommand({
      extension: this.renderLegionStatus,
      itemFormatter: this.formatItemWithAffix
    }))
  }

  private renderLegionStatus: StatusExtensionFn = () => {
    const { player } = this.context
    const { skeleton, maxSkeleton } = player

    Terminal.log(i18n.t('commands.look.status.legion.title'))

    // 고렘 상태 출력
    if (player.golem) {
      const golemStatus = player.golem.isAlive
        ? i18n.t('commands.look.status.legion.status', { hp: player.golem.hp, maxHp: player.golem.maxHp })
        : i18n.t('commands.look.status.legion.golem_destroyed')
      const golemIcon = player.golem.isAlive ? '🤖' : '🛠️'
      Terminal.log(` └ ${golemIcon} ${player.golem.name}: ${golemStatus}`)
    }

    // 기사 상태 출력
    if (player.knight) {
      const knightStatus = player.knight.isAlive
        ? i18n.t('commands.look.status.legion.status', { hp: player.knight.hp, maxHp: player.knight.maxHp })
        : i18n.t('commands.look.status.legion.knight_dead')
      const knightIcon = player.knight.isAlive ? '⚔️' : '💀'
      Terminal.log(` └ ${knightIcon} ${player.knight.name}: ${knightStatus}`)
    }

    // 스켈레톤 군단 요약
    Terminal.log(i18n.t('commands.look.status.legion.skeleton', { count: skeleton.length, max: maxSkeleton }))

    if (player.minions.length === 0) {
      Terminal.log(i18n.t('commands.look.status.legion.no_minions'))
    }
  }

  private formatItemWithAffix: ItemFormatterFn = (item: GameEquipAble, baseText) => {
    let text = baseText
    
    if ('affix' in item && item.affix) {
      const { name, description } = i18n.t(`affix.${item.affix.id}`, { returnObjects: true }) as any
      text += i18n.t('commands.look.status.equipment.affix', { name, description })
    }

    return text
  }
}