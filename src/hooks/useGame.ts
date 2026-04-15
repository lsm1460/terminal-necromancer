import { useCallback } from 'react'
import { useGameContext } from '~/contexts/GameContext'
import { useGameStore } from '~/stores/useGameStore'
import { SaveSystem } from '~/systems/SaveSystem'

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
    return engine.current?.context
  }, [engine])

  const updateConfig = useCallback(
    (newConfig: Record<string, any>) => {
      if (!engine.current) return
      const { context } = engine.current
      context.config = { ...context.config, ...newConfig }

      context.save.saveConfig(context.config)
    },
    [engine]
  )

  const getConfig = useCallback(() => {
    return engine.current?.context.config || {}
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
