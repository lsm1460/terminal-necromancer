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

  const showShortcut = useShowShortcut()

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

  const handleCommand = async (cmd: string) => {
    if (disabled) return

    await engine.current?.processCommand(cmd.toLowerCase(), {
      onBeforeExecute() {
        addLog(`\n> ${cmd}`)
      },
    })
  }

  return (
    <ButtonWrapper>
      {commandList.map((cmd) => (
        <ThemedButton
          key={cmd.name}
          onClick={() => handleCommand(cmd.name)}
          disabled={disabled}
          className="w-full flex items-center justify-center xl:border-primary text-xs xl:border py-3 xl:py-2 xl:text-sm before:content-none! xl:text-primary! transition-colors active:bg-black/80"
          tabIndex={-1}
        >
          <div className="flex flex-col items-center justify-center leading-tight xl:flex-row xl:gap-1">
            <span className="font-medium whitespace-nowrap">{cmd.name}</span>

            {showShortcut && (
              <span className="opacity-70 xl:ml-1" style={{ fontSize: '0.8em' }}>
                ({cmd.key})
              </span>
            )}
          </div>
        </ThemedButton>
      ))}
    </ButtonWrapper>
  )
}

const useShowShortcut = () => {
  const [showShortcut, setShowShortcut] = useState(false)

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

  return showShortcut
}

const ButtonWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOpenButtonMenu } = useGameStore()

  return (
    <div className="xl:mt-auto xl:pb-5">
      <div
        className={`
          grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpenButtonMenu ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
        `}
      >
        <div
          className={`
            overflow-hidden transition-all duration-300
            ${isOpenButtonMenu ? 'translate-y-0' : 'translate-y-4'}
          `}
        >
          <div
            className={`
              w-full bg-grey-800 pb-4 flex-1
              grid grid-cols-3 grid-rows-2
              xl:px-3 xl:flex! xl:flex-col xl:items-stretch xl:grid-cols-none xl:grid-rows-none xl:pb-0 xl:gap-x-0 xl:gap-y-2
            `}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
