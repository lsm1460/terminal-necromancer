import { LogOut, Settings } from 'lucide-react'
import React, { useMemo } from 'react'
import { Terminal } from '~/core'
import { GameEventType } from '~/core/types'
import { useGame } from '~/hooks/useGame'
import i18n from '~/i18n'
import { useGameStore } from '~/stores/useGameStore'
import { ThemedButton } from './common/ThemedButton'

export const StatusBar: React.FC<{ isGameOn: boolean }> = ({ isGameOn }) => {
  const { getPlayer, getContext } = useGame()
  const { logs, setScreen } = useGameStore((state) => state)
  const status = useMemo(() => {
    if (!isGameOn) return

    const player = getPlayer()
    const context = getContext()

    if (!player || !context) {
      return null
    }

    const { map } = context

    return {
      level: player.level,
      hp: player.hp,
      maxHp: player.maxHp,
      mp: player.mp,
      maxMp: player.maxMp,
      location: map?.currentSceneId,
    }
  }, [getPlayer, getContext, logs, isGameOn])

  const handleExit = async () => {
    const _res = await Terminal.confirm(i18n.t('web.save_and_exit'))

    if (_res) {
      const context = getContext()

      if (context) {
        context.eventBus.emitAsync(GameEventType.SYSTEM_EXIT)
      }
    }
  }

  return (
    <div className="h-10 px-2.5 border-primary/30 border-b font-bold text-xs flex items-center">
      {status ? (
        <>
          <p className="flex gap-5">
            <span>LV. {status.level}</span> |
            <span>
              HP: {status.hp.toLocaleString()}/{status.maxHp.toLocaleString()}
            </span>
            |
            <span>
              MP: {status.mp.toLocaleString()}/{status.maxMp.toLocaleString()}
            </span>
          </p>

          <div className="ml-auto flex gap-1 items-center">
            <ThemedButton.round className="bg-transparent" onClick={() => setScreen('CONFIG')}>
              <Settings size={20} />
            </ThemedButton.round>
            <ThemedButton.round className="bg-transparent" onClick={handleExit}>
              <LogOut size={20} />
            </ThemedButton.round>
          </div>
        </>
      ) : (
        <span>Initializing System...</span>
      )}
    </div>
  )
}
