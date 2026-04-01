import { Plus } from 'lucide-react'
import React, { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useInputLock } from '~/hooks/useInputLock'
import { useGameStore } from '~/stores/useGameStore'
import { useGame } from '~/hooks/useGame'
import { ThemedButton } from './common/ThemedButton'

export const GameInput: React.FC = () => {
  const { t } = useTranslation()
  const { uiState, isOpenButtonMenu, resolveUI, toggleButtonMenu } = useGameStore()
  const disabled = useInputLock()
  
  const { processCommand } = useGame()
  const inputRef = useRef<HTMLInputElement>(null)

  // useEffect(() => {
  //   const handleGlobalClick = (e: MouseEvent) => {
  //     if (disabled) return

  //     const target = e.target as HTMLElement
  //     const isTextButton = target.closest('.js-focus-ignore')

  //     if (!isTextButton) {
  //       inputRef.current?.focus()
  //     }
  //   }

  //   if (!disabled) {
  //     inputRef.current?.focus()
  //   }

  //   window.addEventListener('click', handleGlobalClick)
  //   return () => window.removeEventListener('click', handleGlobalClick)
  // }, [disabled])

  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Enter') {
      if (uiState.type === 'PROMPT') {
        resolveUI(undefined)
        return
      }

      const inputElement = e.currentTarget
      const cmd = inputElement.value.trim()

      if (cmd) {
        await processCommand(cmd, {
          onBeforeExecute() {
            inputElement.value = ''
          },
        })
      }
    }
  }

  const openHelp = useCallback(async () => {
    await processCommand('help')
  }, [processCommand])

  return (
    <div className="flex items-center gap-1 p-2 xl:p-4 border-t border-primary/30">
      <ThemedButton.round className="xl:hidden" onClick={toggleButtonMenu}>
        <div className={`flex items-center justify-center ${isOpenButtonMenu ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={16} strokeWidth={2.5} />
        </div>
      </ThemedButton.round>

      <div className="flex flex-1 w-full rounded-full bg-black/50 h-8 px-4 xl:px-0 xl:h-auto xl:bg-transparent">
        <input
          ref={inputRef}
          className="flex-1 bg-transparent border-none text-primary outline-none font-inherit text-xs xl:text-base placeholder:text-primary/50 disabled:cursor-not-allowed"
          onKeyDown={handleCommand}
          placeholder={disabled ? t('web.select_an_option') : t('input_command')}
          disabled={disabled}
        />
      </div>

      <ThemedButton.round className="font-bold xl:hidden" onClick={openHelp}>
        ?
      </ThemedButton.round>
    </div>
  )
}