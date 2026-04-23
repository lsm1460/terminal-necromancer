import { useEffect, useRef } from 'react'
import { getTileFromDirection, printPath } from '~/commands'
import { COMMAND_GROUPS, COMMAND_KEYS } from '~/consts'
import { Terminal } from '~/core'
import { useGame } from '~/hooks/useGame'
import { useInputLock } from '~/hooks/useInputLock'
import i18n from '~/i18n'
import { useGameStore } from '~/stores/useGameStore'
import { AnsiHtml } from './Ansi'
import { DecisionBox } from './DecisionBox'

const DIRECTION_MAP: Record<string, string> = {}

Object.entries({
  up: COMMAND_GROUPS[COMMAND_KEYS.UP],
  down: COMMAND_GROUPS[COMMAND_KEYS.DOWN],
  left: COMMAND_GROUPS[COMMAND_KEYS.LEFT],
  right: COMMAND_GROUPS[COMMAND_KEYS.RIGHT],
}).forEach(([direction, commands]) => {
  commands.forEach((cmd) => {
    DIRECTION_MAP[cmd] = direction
  })
})

export const LogWindow: React.FC = () => {
  const { getPlayer, getContext, getConfig, processCommand } = useGame()
  const { isOpenButtonMenu, logs, uiState, resolveUI } = useGameStore()
  const disabled = useInputLock()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior,
        })
      }
    }

    scrollToBottom()

    const timeoutId = setTimeout(scrollToBottom, 100)

    return () => clearTimeout(timeoutId)
  }, [logs, uiState, isOpenButtonMenu])

  const handleLogCommand = async (event: any) => {
    if (disabled) return
    
    let { command, arg } = event.target.dataset
    if (!command) return

    if (arg) {
      command += ` --${arg}`
    }

    const canProceed = await checkDirectionAndConfirm(command)

    if (!canProceed) {
      return
    }

    await processCommand(command)
  }

  const checkDirectionAndConfirm = async (command: string): Promise<boolean> => {
    const { shouldConfirm, tile } = shouldConfirmMovement(command)

    if (!shouldConfirm || !tile) {
      return true // 검증 대상이 아니면 그냥 진행
    }

    printPath(tile)
    return await Terminal.confirm(i18n.t('confirm_move_to_tile', { direction: command }))
  }

  const shouldConfirmMovement = (command: string) => {
    const player = getPlayer()
    const context = getContext()

    if (!player || !context) return { shouldConfirm: false }

    const { map } = context
    const config = getConfig()

    const directionKey = DIRECTION_MAP[command]
    const isSearchFirst = config?.isSearchFirst ?? true

    if (!directionKey || !isSearchFirst) {
      return { shouldConfirm: false }
    }

    const tile = getTileFromDirection(player.pos, map, directionKey)
    if (!tile) return { shouldConfirm: false }

    const hasDanger = !tile.isClear && tile.event && (tile.event.includes('boss') || tile.event.startsWith('monster'))

    return {
      shouldConfirm: !!hasDanger, // 위험 요소가 있을 때만 true
      tile,
    }
  }

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden p-5 whitespace-pre-wrap leading-relaxed 
             scrollbar-thin scrollbar-track-[#1e1e1e] scrollbar-thumb-[#444] hover:scrollbar-thumb-[#555] pointer-events-none text-sm xl:text-sm
             scroll-smooth"
      ref={scrollRef}
      onClick={handleLogCommand}
    >
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <AnsiHtml message={log} className="pointer-events-auto select-none" />
        </div>
      ))}

      <DecisionBox uiState={uiState} resolveUI={resolveUI} />
    </div>
  )
}
