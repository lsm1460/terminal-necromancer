import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GameEngine } from '~/gameEngine'
import { useInputLock } from '~/hooks/useInputLock'
import { getCommandMap } from '~/hooks/useShortcuts'
import i18n from '~/i18n'
import { useGameStore } from '~/stores/useGameStore'
import { ThemedButton } from './common/ThemedButton'

const EXCLUDED_COMMANDS = [i18n.t('commands.map.label')]

export const ButtonList: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const { t } = useTranslation()
  const { addLog } = useGameStore()
  const disabled = useInputLock()

  const [isOpen, setIsOpen] = useState(false)
  const [showShortcut, setShowShortcut] = useState(false)

  const commandList = useMemo(() => {
    const commandsMap = getCommandMap()

    return Object.entries(commandsMap)
      .filter(([_, name]) => !EXCLUDED_COMMANDS.includes(name))
      .map(([key, name]) => ({
        name,
        key: `alt + ${key}`,
        rawKey: key,
      }))
  }, [t])

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const hasPrecisionPointer = window.matchMedia('(pointer: fine)').matches

    // PC 환경이거나 마우스가 연결된 경우 즉시 표시
    if (!isMobile || hasPrecisionPointer) {
      setShowShortcut(true)
    }

    // 2. 물리 키보드 연결 실시간 감지 (첫 키 입력 시 전환)
    const handleFirstKeydown = () => {
      setShowShortcut(true)
      // 한 번 감지되면 이벤트 리스너 제거
      window.removeEventListener('keydown', handleFirstKeydown)
    }

    window.addEventListener('keydown', handleFirstKeydown)

    // 3. 포인터 환경 변화 감지 (블루투스 마우스 연결 등)
    const mediaQuery = window.matchMedia('(pointer: fine)')
    const handlePointerChange = (e: MediaQueryListEvent) => {
      if (e.matches) setShowShortcut(true)
    }
    mediaQuery.addEventListener('change', handlePointerChange)

    return () => {
      window.removeEventListener('keydown', handleFirstKeydown)
      mediaQuery.removeEventListener('change', handlePointerChange)
    }
  }, [])

  const handleCommand = async (cmd: string) => {
    if (disabled) return

    await engine.current?.processCommand(cmd.toLowerCase(), {
      onBeforeExecute() {
        addLog(`\n> ${cmd}`)
      },
    })
  }

  return (
    <div className="relative mt-6 xl:mt-auto xl:pb-5">
      <button
        tabIndex={-1}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          absolute px-2 xl:px-4 pt-1 xl:pt-2 pb-1 text-[10px] xl:text-xs border-t border-l border-r border-primary
          rounded-t-lg bg-grey-900
          z-[1] left-3 top-0.5 -translate-y-full
          xl:hidden
        `}
      >
        {isOpen ? t('web.close_command_menu') : t('web.open_command_menu')}
      </button>

      <div
        className="w-full bg-grey-900 flex-wrap justify-center items-center gap-3 px-3 py-1 border-t border-primary xl:flex-col xl:flex! xl:border-t-0 xl:items-stretch flex-1"
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        {commandList.map((cmd) => (
          <ThemedButton
            key={cmd.name}
            onClick={() => handleCommand(cmd.name)}
            disabled={disabled}
            className="xl:border-primary text-xs xl:border xl:py-2 xl:text-sm"
            tabIndex={-1}
          >
            {cmd.name}
            {showShortcut && <span style={{ fontSize: '0.8em', marginLeft: '4px', opacity: 0.7 }}>({cmd.key})</span>}
          </ThemedButton>
        ))}
      </div>
    </div>
  )
}
