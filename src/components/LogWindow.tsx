import React, { useEffect, useRef } from 'react'
import { useGameStore } from '~/stores/useGameStore'

export const LogWindow = () => {
  const { logs, uiState, resolveUI } = useGameStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, uiState])

  return (
    <div className="log-window" ref={scrollRef}>
      {logs.map((log, i) => (
        <div key={i} className="log-line">{log}</div>
      ))}

      {uiState.type !== 'NONE' && (
        <div className="interactive-area">
          <div className="question">▶ {uiState.message}</div>
          <div className="button-group">
            {uiState.type === 'SELECT' && uiState.choices?.map((c) => (
              <button key={c.name} onClick={() => resolveUI(c.name, c.message)}>
                [{c.message}]
              </button>
            ))}

            {uiState.type === 'CONFIRM' && (
              <>
                <button onClick={() => resolveUI(true, '예')}>[예]</button>
                <button onClick={() => resolveUI(false, '아니오')}>[아니오]</button>
              </>
            )}

            {uiState.type === 'PROMPT' && (
              <button onClick={() => resolveUI(undefined, uiState.message)}>
                [계속하려면 클릭 또는 Enter]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}