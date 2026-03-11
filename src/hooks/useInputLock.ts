import { useMemo } from 'react'
import { useGameStore } from '~/stores/useGameStore'

export const useInputLock = () => {
  const { uiState, isLoading } = useGameStore()

  const disabled = useMemo(() => {
    if (isLoading) return true

    return uiState.type !== 'NONE' && uiState.type !== 'PROMPT'
  }, [uiState.type, isLoading])

  return disabled
}
