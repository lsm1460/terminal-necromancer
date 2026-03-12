import { useCallback, useEffect } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { useInputLock } from './useInputLock'
import i18n from '~/i18n'
import { useTranslation } from 'react-i18next'

export const getCommandMap = (): Record<string, string> => ({
  a: i18n.t('commands.attack'),
  k: i18n.t('commands.skill'),
  s: i18n.t('commands.status'),
  i: i18n.t('commands.inventory'),
  m: i18n.t('commands.map'),
  g: i18n.t('commands.pick'),
  l: i18n.t('commands.look'),
  h: i18n.t('commands.help'),
})

export const useShortcuts = (engine: React.RefObject<GameEngine | null>) => {
  const { t } = useTranslation()
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
        const commandsMap = getCommandMap()

        if (key in commandsMap) {
          e.preventDefault()

          await submitCommand(commandsMap[key])
        }
        return
      }

      if (!disabled) {
        const arrowMap: Record<string, string> = {
          ArrowUp: t('up'),
          ArrowDown: t('down'),
          ArrowLeft: t('left'),
          ArrowRight: t('right'),
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
