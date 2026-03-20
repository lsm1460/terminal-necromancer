import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { useInputLock } from './useInputLock'

export const useSwipeShortcuts = (engine: React.RefObject<GameEngine | null>) => {
  const { t } = useTranslation()
  const disabled = useInputLock()
  const { addLog } = useGameStore()

  const touchStartPos = useRef<{ x: number; y: number } | null>(null)
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
    // 1. 터치 시작: 두 손가락일 때만 좌표 기록
    const handleTouchStart = (e: TouchEvent) => {
      if (disabled) return

      if (e.touches.length === 2) {
        // 두 손가락 사이의 중간 지점을 기준점으로 잡습니다.
        touchStartPos.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        }
      } else {
        // 손가락이 1개거나 3개 이상이면 무시
        touchStartPos.current = null
      }
    }

    // 2. 터치 이동: 두 손가락 조작 시 브라우저 스크롤(확대/축소 등) 방지
    const handleTouchMove = (e: TouchEvent) => {
      if (!disabled && e.touches.length === 2) {
        // 두 손가락으로 게임 조작 중일 때는 화면이 밀리지 않도록 고정
        if (e.cancelable) e.preventDefault()
      }
    }

    // 3. 터치 종료: 방향 계산 및 실행
    const handleTouchEnd = async (e: TouchEvent) => {
      // 시작할 때 두 손가락이었고, 이제 손가락이 떨어지는 시점
      if (disabled || !touchStartPos.current) return

      // touchend에서는 e.touches가 아닌 e.changedTouches를 확인해야 합니다.
      const touchEndPos = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      }

      const deltaX = touchEndPos.x - touchStartPos.current.x
      const deltaY = touchEndPos.y - touchStartPos.current.y

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      const SWIPE_THRESHOLD = 40 // 두 손가락은 한 손보다 조작이 무거우므로 약간 낮게 설정 가능

      if (Math.max(absX, absY) > SWIPE_THRESHOLD) {
        let command = ''
        if (absX > absY) {
          command = deltaX > 0 ? t('right') : t('left')
        } else {
          command = deltaY > 0 ? t('down') : t('up')
        }

        if (command) {
          await submitCommand(command)
        }
      }

      // 조작 완료 후 초기화
      touchStartPos.current = null
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [disabled, submitCommand, t])
}
