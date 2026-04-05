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
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (uiState.type === 'MULTISELECT' && uiState.options?.initial) {
      setSelectedValues(Array.isArray(uiState.options.initial) ? uiState.options.initial : [])
    } else {
      setSelectedValues([])
    }
  }, [uiState])

  useEffect(() => {
    const firstEnabledIndex = buttonRefs.current.findIndex((button) => button && !button.disabled)

    if (firstEnabledIndex !== -1) {
      setFocusedIndex(firstEnabledIndex)

      setTimeout(() => {
        buttonRefs.current[firstEnabledIndex]?.focus()
      }, 10)
    }
  }, [uiState.type, uiState.message])

  useEffect(() => {
    if (uiState.type === 'PROMPT') {
      const handleScreenClick = () => {
        resolveUI(undefined, uiState.message)
      }

      window.addEventListener('click', handleScreenClick)

      return () => {
        window.removeEventListener('click', handleScreenClick)
      }
    }
  }, [uiState])

  const handleToggleSelect = (name: string) => {
    const max = uiState.options?.maxChoices

    setSelectedValues((prev) => {
      if (prev.includes(name)) {
        return prev.filter((v) => v !== name)
      }

      if (max && prev.length >= max) {
        return prev
      }

      return [...prev, name]
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const activeButtons = buttonRefs.current.filter(Boolean)
    const total = activeButtons.length

    if (total <= 1) return

    let nextIndex = focusedIndex
    const direction =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0

    if (direction === 0) return // 방향키가 아니면 종료
    e.preventDefault()

    let attempts = 0
    while (attempts < total) {
      nextIndex = (nextIndex + direction + total) % total
      attempts++

      if (activeButtons[nextIndex] && !activeButtons[nextIndex]?.disabled) {
        setFocusedIndex(nextIndex)
        activeButtons[nextIndex]?.focus()
        break
      }
    }
  }

  if (uiState.type === 'NONE') return null

  return (
    <div onKeyDown={handleKeyDown}>
      <div className="text-[#ffff00] font-bold">
        <AnsiHtml message={'▶ ' + uiState.message} />
      </div>
      <div className="flex flex-col">
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

        {uiState.type === 'MULTISELECT' && (
          <>
            {uiState.choices?.map((c, i) => {
              const isSelected = selectedValues.includes(c.name)
              return (
                <div key={c.name}>
                  <ThemedButton
                    ref={(el) => {
                      buttonRefs.current[i] = el
                    }}
                    onFocus={() => setFocusedIndex(i)}
                    onClick={() => handleToggleSelect(c.name)}
                    disabled={c.disabled}
                    className={isSelected ? 'border-solid border-yellow-400! text-yellow-400!' : ''}
                  >
                    <AnsiHtml message={c.message} />
                  </ThemedButton>
                </div>
              )
            })}
            {/* 최종 결정 버튼 (마지막 인덱스 부여) */}
            <div className="mt-2 pt-2 border-t border-gray-800">
              <ThemedButton
                ref={(el) => {
                  buttonRefs.current[uiState.choices?.length || 0] = el
                }}
                onFocus={() => setFocusedIndex(uiState.choices?.length || 0)}
                onClick={() => resolveUI(selectedValues, t('web.confirm'))}
              >
                ▶ [{t('web.confirm_selection')}]
              </ThemedButton>
            </div>
          </>
        )}

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
