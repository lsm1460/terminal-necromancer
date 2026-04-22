import { useCallback } from 'react'
import { useGameContext } from '~/contexts/GameContext'
import { GameContext } from '~/core/types'
import { useGameStore } from '~/stores/useGameStore'

export const useGame = () => {
  const { engine } = useGameContext()
  const addLog = useGameStore((state) => state.addLog)

  const processCommand = useCallback(
    async (command: string, options?: { onBeforeExecute?: () => void }) => {
      if (!engine.current) return

      await engine.current.processCommand(command, {
        onBeforeExecute() {
          addLog(`> ${command}`)
          options?.onBeforeExecute?.()
        },
      })
    },
    [engine, addLog]
  )

  const getPlayer = useCallback(() => {
    return engine.current?.context?.player
  }, [engine])

  const getContext = useCallback(() => {
    return engine.current?.context as GameContext | undefined
  }, [engine])

  const updateConfig = useCallback(
    (newConfig: Record<string, any>) => {
      if (!engine.current) return
      const { context } = engine.current
      const _config = context.config.load()

      context.config.save({ ..._config, ...newConfig })
    },
    [engine]
  )

  const getConfig = useCallback(() => {
    if (!engine.current) return {}
    return engine.current.context.config.load() || {}
  }, [engine])

  return {
    engine: engine.current,
    processCommand,
    getPlayer,
    getContext,
    updateConfig,
    getConfig,
  }
}
