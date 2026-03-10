import { useCallback, useEffect } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { useInputLock } from './useInputLock'

export const COMMAND_MAP: Record<string, string> = {
  a: '공격',
  k: '스킬',
  s: '상태',
  i: '인벤토리',
  m: '지도',
  g: '줍기',
  l: '보기',
  h: '도움말',
}

export const useShortcuts = (engine: React.RefObject<GameEngine | null>) => {
  const disabled = useInputLock()
  const { addLog } = useGameStore()

  const submitCommand = useCallback(
    async (cmd: string) => {
      if (disabled) return

      await engine.current?.processCommand(cmd, {
        onBeforeExecute() {
          addLog(`\n> ${cmd}`)
        },
      })
    },
    [disabled, addLog]
  )

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (disabled) return

      const isModifier = e.altKey
      const key = e.key

      if (isModifier) {
        if (key in COMMAND_MAP) {
          e.preventDefault()
          await submitCommand(COMMAND_MAP[key])
        }
        return
      }

      if (!disabled) {
        const arrowMap: Record<string, string> = {
          ArrowUp: '위',
          ArrowDown: '아래',
          ArrowLeft: '왼쪽',
          ArrowRight: '오른쪽',
        }

        if (key in arrowMap) {
          e.preventDefault()
          await submitCommand(arrowMap[key])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, submitCommand])
}
