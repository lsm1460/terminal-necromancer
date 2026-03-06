import { useEffect, useRef, useState } from 'react'
import { UIState } from '~/renderers/ReactRenderer'
import { ThemedButton } from './common/ThemedButton'

interface DecisionBoxProps {
  uiState: UIState
  resolveUI: (value: any, message: string) => void
}

export const DecisionBox = ({ uiState, resolveUI }: DecisionBoxProps) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    setFocusedIndex(0)
    setTimeout(() => buttonRefs.current[0]?.focus(), 10)
  }, [uiState.type, uiState.message])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = buttonRefs.current.filter(Boolean).length
    if (total <= 1) return

    let nextIndex = focusedIndex
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      nextIndex = (focusedIndex + 1) % total
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      nextIndex = (focusedIndex - 1 + total) % total
    } else {
      return
    }

    setFocusedIndex(nextIndex)
    buttonRefs.current[nextIndex]?.focus()
  }

  if (uiState.type === 'NONE') return null

  return (
    <div
      className="mt-5 p-4 border border-dashed border-primary bg-[#0a0a0a] animate-in fade-in duration-300"
      onKeyDown={handleKeyDown}
    >
      <div className="mb-2.5 text-[#ffff00] font-bold">▶ {uiState.message}</div>
      <div className="flex gap-4 flex-wrap">
        {uiState.type === 'SELECT' &&
          uiState.choices?.map((c, i) => (
            <ThemedButton
              key={c.name}
              ref={(el) => {
                buttonRefs.current[i] = el
              }}
              onFocus={() => setFocusedIndex(i)}
              onClick={() => resolveUI(c.name, c.message)}
            >
              [{c.message}]
            </ThemedButton>
          ))}

        {uiState.type === 'CONFIRM' && (
          <>
            <ThemedButton
              ref={(el) => {
                buttonRefs.current[0] = el
              }}
              onFocus={() => setFocusedIndex(0)}
              onClick={() => resolveUI(true, '예')}
            >
              [예]
            </ThemedButton>
            <ThemedButton
              ref={(el) => {
                buttonRefs.current[1] = el
              }}
              onFocus={() => setFocusedIndex(1)}
              onClick={() => resolveUI(false, '아니오')}
            >
              [아니오]
            </ThemedButton>
          </>
        )}

        {uiState.type === 'PROMPT' && (
          <ThemedButton
            ref={(el) => {
              buttonRefs.current[0] = el
            }}
            onFocus={() => setFocusedIndex(0)}
            onClick={() => resolveUI(undefined, uiState.message)}
          >
            {'> '}[계속하려면 클릭 또는 Enter]
          </ThemedButton>
        )}
      </div>
    </div>
  )
}
