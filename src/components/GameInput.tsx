import React, { useMemo } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { GameEngine } from '~/gameEngine'

interface GameInputProps {
  engine: React.RefObject<GameEngine | null>
}

export const GameInput: React.FC<GameInputProps> = ({ engine }) => {
  const { uiState, addLog, resolveUI } = useGameStore()

  // 입력창 활성화 여부 계산
  const disabledInput = useMemo(() => uiState.type !== 'NONE' && uiState.type !== 'PROMPT', [uiState.type])

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // PROMPT 상태(계속하려면 Enter)일 때 처리
      if (uiState.type === 'PROMPT') {
        resolveUI(undefined)
        return
      }
      
      const inputElement = e.currentTarget
      const cmd = inputElement.value.trim()
      
      if (cmd) {
        addLog(`> ${cmd}`) // 유저 입력 기록
        inputElement.value = '' // 입력창 비우기
        await engine.current?.processCommand(cmd) // 엔진에 명령어 전달
      }
    }
  }

  return (
    <div className="input-area">
      <span className="prompt-char">{'>'}</span>
      <input
        autoFocus
        onKeyDown={handleCommand}
        placeholder={disabledInput ? '선택지를 클릭하세요...' : '명령어를 입력하세요...'}
        disabled={disabledInput}
      />
    </div>
  )
}
