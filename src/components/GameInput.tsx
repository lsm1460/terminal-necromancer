import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GameEngine } from '~/gameEngine'
import { useInputLock } from '~/hooks/useInputLock'
import { useGameStore } from '~/stores/useGameStore'

interface GameInputProps {
  engine: React.RefObject<GameEngine | null>
}

export const GameInput: React.FC<GameInputProps> = ({ engine }) => {
  const { t } = useTranslation()
  const { uiState, addLog, resolveUI } = useGameStore()
  const disabled = useInputLock()

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleGlobalClick = () => {
      if (!disabled) {
        inputRef.current?.focus()
      }
    }

    if (!disabled) {
      inputRef.current?.focus()
    }

    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [disabled])

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Enter') {
      if (uiState.type === 'PROMPT') {
        resolveUI(undefined)
        return
      }

      const inputElement = e.currentTarget
      const cmd = inputElement.value.trim()

      if (cmd) {
        await engine.current?.processCommand(cmd, {
          onBeforeExecute() {
            addLog(`\n> ${cmd}`)
            inputElement.value = ''
          },
        })
      }
    }
  }

  return (
    <div className="flex items-center p-2 xl:p-4 border-t border-primary">
      <span className="mr-2.5 text-primary">{'>'}</span>
      <input
        ref={inputRef}
        className="flex-1 bg-transparent border-none text-primary outline-none font-inherit text-xs xl:text-base placeholder:text-primary/50 disabled:cursor-not-allowed"
        autoFocus
        onKeyDown={handleCommand}
        placeholder={disabled ? t('web.select_an_option') : t('input_command')}
        disabled={disabled}
      />
    </div>
  )
}
