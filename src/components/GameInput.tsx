import React, { useEffect, useMemo, useRef } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { GameEngine } from '~/gameEngine'

interface GameInputProps {
  engine: React.RefObject<GameEngine | null>
}

export const GameInput: React.FC<GameInputProps> = ({ engine }) => {
  const { uiState, isLoading, addLog, resolveUI } = useGameStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const disabledInput = useMemo(() => {
    if (isLoading) return true

    return uiState.type !== 'NONE' && uiState.type !== 'PROMPT'}, [uiState.type, isLoading])

  // 2. 포커스 복구 로직
  useEffect(() => {
    const handleGlobalClick = () => {
      if (!disabledInput) {
        inputRef.current?.focus()
      }
    }

    if (!disabledInput) {
      inputRef.current?.focus()
    }

    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [disabledInput])

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoading) return

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
    <div className="flex items-center p-4 border-t border-primary">
      <span className="mr-2.5 text-primary">{'>'}</span>
      <input
        ref={inputRef}
        className="flex-1 bg-transparent border-none text-primary outline-none font-inherit text-base placeholder:text-primary/50 disabled:cursor-not-allowed"
        autoFocus
        onKeyDown={handleCommand}
        placeholder={disabledInput ? '선택지를 클릭하세요...' : '명령어를 입력하세요...'}
        disabled={disabledInput}
      />
    </div>
  )
}
