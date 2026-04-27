import { printTileStatus } from '~/core/statusPrinter'
import { Terminal } from '~/core'
import { GameEventType } from '~/core/types'
import i18n from '~/i18n'
import { AppContext } from '~/systems/types'
import { PortalService } from './service'

export const PortalActions = {
  /**
   * 포탈 사용 확인 후 실제 이동 및 연출 수행
   */
  async handleMove(context: AppContext) {
    const { map, eventBus, npcs } = context

    const confirm = await Terminal.confirm(i18n.t('npc.portal.confirm'))

    if (confirm) {
      // 1. 좌표 이동 실행
      const sceneId = PortalService.relocateToStart(context)

      // 2. 이동 성공 로그 출력
      Terminal.log(i18n.t('npc.portal.success', { location: i18n.t(`scene.${sceneId}`) }))

      const { currentTile } = context
      await map.handleTileEvent(currentTile, context)
      eventBus.emitAsync(GameEventType.PLAYER_MOVE, { npcs })

      // 4. 타일 상태 출력
      printTileStatus(context)
    } else {
      Terminal.log(i18n.t('npc.portal.cancel'))
    }

    return true
  }
}