import { Terminal } from '~/core/Terminal'
import i18n from '~/i18n'
import { printTileStatus } from '~/statusPrinter'
import { GameContext } from '~/types'
import { PortalService } from './service'

export const PortalActions = {
  /**
   * 포탈 사용 확인 후 실제 이동 및 연출 수행
   */
  async handleMove(context: GameContext) {
    const { player, map, broadcast } = context

    const confirm = await Terminal.confirm(i18n.t('npc.portal.confirm'))

    if (confirm) {
      // 1. 좌표 이동 실행
      const sceneId = PortalService.relocateToStart(context)

      // 2. 이동 성공 로그 출력
      Terminal.log(i18n.t('npc.portal.success', { location: i18n.t(`scene.${sceneId}`) }))

      // 3. 이동한 타일의 이벤트 처리 및 방송 재생
      const tile = map.getTile(player.pos)
      await map.handleTileEvent(tile, context)
      broadcast.play()

      // 4. 타일 상태 출력
      printTileStatus(context)
    } else {
      Terminal.log(i18n.t('npc.portal.cancel'))
    }

    return true
  }
}