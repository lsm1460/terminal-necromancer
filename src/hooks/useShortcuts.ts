import { useCallback, useEffect } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'

export const useShortcuts = (engine: React.RefObject<GameEngine | null>) => {
  const { uiState, isLoading, addLog } = useGameStore()

  const submitCommand = useCallback(
    async (cmd: string) => {
      if (isLoading) return

      await engine.current?.processCommand(cmd, {
        onBeforeExecute() {
          addLog(`\n> ${cmd}`)
        },
      })
    },
    [isLoading, addLog]
  )

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isLoading) return

      const isModifier = e.ctrlKey || e.metaKey
      const key = e.key

      if (isModifier) {
        const commandMap: Record<string, string> = {
          a: '공격',
          k: '스킬',
          i: '인벤토리',
          s: '상태',
          m: '지도',
          g: '줍기',
          l: '보기',
          h: '도움말',
        }

        if (key in commandMap) {
          e.preventDefault()
          await submitCommand(commandMap[key])
        }
        return
      }

      const isNavigable = uiState.type === 'NONE'

      if (isNavigable) {
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
  }, [uiState.type, isLoading, submitCommand])
}
