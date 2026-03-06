import Ansi from 'ansi-to-react'
import { useEffect, useRef } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { DecisionBox } from './DecisionBox'

export const LogWindow = () => {
  const { logs, uiState, resolveUI } = useGameStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, uiState])

  return (
    <div
      className="flex-1 overflow-y-auto p-5 whitespace-pre-wrap leading-relaxed 
             scrollbar-thin scrollbar-track-[#1e1e1e] scrollbar-thumb-[#444] hover:scrollbar-thumb-[#555]"
      ref={scrollRef}
    >
      {logs.map((log, i) => (
        <div key={i} className="mb-1">
          <Ansi>{log}</Ansi>
        </div>
      ))}

      <DecisionBox uiState={uiState} resolveUI={resolveUI} />
    </div>
  )
}
