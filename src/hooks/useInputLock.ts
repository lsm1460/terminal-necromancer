import { useMemo } from 'react'
import { useBattleStore } from '~/stores/useBattleStore'
import { useGameStore } from '~/stores/useGameStore'

export const useInputLock = () => {
  const { uiState, isLoading } = useGameStore()
  const { inBattle } = useBattleStore()

  const disabled = useMemo(() => {
    if (isLoading) return true
    if (inBattle) return true

    return uiState.type !== 'NONE' && uiState.type !== 'PROMPT'
  }, [uiState.type, isLoading, inBattle])

  return disabled
}
