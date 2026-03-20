import { useEffect, useRef } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { AnsiHtml } from './Ansi'
import { DecisionBox } from './DecisionBox'
import { GameEngine } from '~/gameEngine'

export const LogWindow: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const { logs, uiState, addLog, resolveUI } = useGameStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, uiState])

  const handleLogCommand = async (event: any) => {
    let { command, arg } = event.target.dataset

    if (!command) {
      return
    }

    if (arg) {
      command += ` --${arg}`
    }

    await engine.current?.processCommand(command, {
      onBeforeExecute() {
        addLog(command)
      },
    })
  }

  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden p-5 whitespace-pre-wrap leading-relaxed 
             scrollbar-thin scrollbar-track-[#1e1e1e] scrollbar-thumb-[#444] hover:scrollbar-thumb-[#555] pointer-events-none text-xs xl:text-sm"
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
