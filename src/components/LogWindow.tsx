import { useEffect, useRef } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { AnsiHtml } from './Ansi'
import { DecisionBox } from './DecisionBox'
import { COMMAND_GROUPS, COMMAND_KEYS } from '~/consts'
import { Terminal } from '~/core/Terminal'

export const LogWindow: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const { isOpenButtonMenu, logs, uiState, addLog, resolveUI } = useGameStore()
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

    scrollToBottom('smooth')

    const timeoutId = setTimeout(scrollToBottom, 310)

    return () => clearTimeout(timeoutId)
  }, [logs, uiState, isOpenButtonMenu])

  const processCommand = async (command: string) =>
    engine.current?.processCommand(command, {
      onBeforeExecute() {
        addLog(`> ${command}`)
      },
    })

  const handleLogCommand = async (event: any) => {
    let { command, arg } = event.target.dataset

    if (!command) {
      return
    }

    if (arg) {
      command += ` --${arg}`
    }

    const directionList = [
      ...COMMAND_GROUPS[COMMAND_KEYS.UP],
      ...COMMAND_GROUPS[COMMAND_KEYS.DOWN],
      ...COMMAND_GROUPS[COMMAND_KEYS.LEFT],
      ...COMMAND_GROUPS[COMMAND_KEYS.RIGHT],
    ]

    if (directionList.includes(command)) {
      const isSearchFirst = engine.current?.context.config?.isSearchFirst

      const proceed = await Terminal.confirm('test')

      if (!proceed) {
        return
      }
    }

    await processCommand(command)
  }

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden p-5 whitespace-pre-wrap leading-relaxed 
             scrollbar-thin scrollbar-track-[#1e1e1e] scrollbar-thumb-[#444] hover:scrollbar-thumb-[#555] pointer-events-none text-xs xl:text-sm
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
