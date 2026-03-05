import { useEffect, useRef } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import ThemedButton from './common/ThemedButton'

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
          {log}
        </div>
      ))}

      {uiState.type !== 'NONE' && (
        <div className="mt-5 p-4 border border-dashed border-primary bg-[#0a0a0a]">
          <div className="mb-2.5 text-[#ffff00]">▶ {uiState.message}</div>
          <div className="flex gap-4 flex-wrap">
            {uiState.type === 'SELECT' &&
              uiState.choices?.map((c) => (
                <ThemedButton key={c.name} onClick={() => resolveUI(c.name, c.message)}>
                  [{c.message}]
                </ThemedButton>
              ))}

            {uiState.type === 'CONFIRM' && (
              <>
                <ThemedButton onClick={() => resolveUI(true, '예')}>[예]</ThemedButton>
                <ThemedButton onClick={() => resolveUI(false, '아니오')}>[아니오]</ThemedButton>
              </>
            )}

            {uiState.type === 'PROMPT' && (
              <ThemedButton onClick={() => resolveUI(undefined, uiState.message)}>
                [계속하려면 클릭 또는 Enter]
              </ThemedButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
