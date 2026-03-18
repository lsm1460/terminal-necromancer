import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UIState } from '~/renderers/ReactRenderer'
import { AnsiHtml } from './Ansi'
import { ThemedButton } from './common/ThemedButton'

interface DecisionBoxProps {
  uiState: UIState
  resolveUI: (value: any, message: string) => void
}

export const DecisionBox = ({ uiState, resolveUI }: DecisionBoxProps) => {
  const { t } = useTranslation()

  const [focusedIndex, setFocusedIndex] = useState(0)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const firstEnabledIndex = buttonRefs.current.findIndex((button) => button && !button.disabled)

    if (firstEnabledIndex !== -1) {
      setFocusedIndex(firstEnabledIndex)

      setTimeout(() => {
        buttonRefs.current[firstEnabledIndex]?.focus()
      }, 10)
    }
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
      <div className="flex flex-col gap-2 flex-wrap">
        {uiState.type === 'SELECT' &&
          uiState.choices?.map((c, i) => (
            <div key={c.name}>
              <ThemedButton
                ref={(el) => {
                  buttonRefs.current[i] = el
                }}
                onFocus={() => setFocusedIndex(i)}
                onClick={() => resolveUI(c.name, c.message)}
                disabled={c.disabled}
              >
                <AnsiHtml message={c.message} />
              </ThemedButton>
            </div>
          ))}

        {uiState.type === 'CONFIRM' && (
          <>
            <div>
              <ThemedButton
                ref={(el) => {
                  buttonRefs.current[0] = el
                }}
                onFocus={() => setFocusedIndex(0)}
                onClick={() => resolveUI(true, t('yes'))}
              >
                [{t('yes')}]
              </ThemedButton>
            </div>
            <div>
              <ThemedButton
                ref={(el) => {
                  buttonRefs.current[1] = el
                }}
                onFocus={() => setFocusedIndex(1)}
                onClick={() => resolveUI(false, t('no'))}
              >
                [{t('no')}]
              </ThemedButton>
            </div>
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
            {'> '}[{t('web.continue')}]
          </ThemedButton>
        )}
      </div>
    </div>
  )
}
