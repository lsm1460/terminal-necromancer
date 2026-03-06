import { useEffect } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { useBattleStore } from '~/stores/useBattleStore' // 배틀 스토어 가정
import { GameEngine } from '~/gameEngine'

export const useShortcuts = (engine: React.RefObject<GameEngine | null>) => {
  const { uiState, addLog } = useGameStore()
  const { inBattle } = useBattleStore()

  const submitCommand = async (cmd: string) => {
    addLog(`\n> ${cmd}`)

    await engine.current?.processCommand(cmd)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey
      const key = e.key

      if (isModifier) {
        e.preventDefault()
        switch (key) {
          case 'a':
            submitCommand('공격')
            break
          case 'k':
            submitCommand('스킬')
            break
          case 'i':
            submitCommand('인벤토리')
            break
          case 's':
            submitCommand('상태')
            break
          case 'm':
            submitCommand('지도')
            break
          case 'g':
            submitCommand('줍기')
            break
          case 'l':
            submitCommand('보기')
            break
          case 'h':
            submitCommand('도움말')
            break
        }
        return
      }

      const isNavigable = uiState.type === 'NONE' && !inBattle

      if (isNavigable) {
        const arrowMap: Record<string, string> = {
          ArrowUp: '위',
          ArrowDown: '아래',
          ArrowLeft: '왼쪽',
          ArrowRight: '오른쪽',
        }

        if (key in arrowMap) {
          e.preventDefault()

          submitCommand(arrowMap[key])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [uiState.type, inBattle])
}
