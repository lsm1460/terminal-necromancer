import { motion } from 'framer-motion'
import React, { ReactNode } from 'react'
import { useGameStore } from '~/stores/useGameStore'
import { AppScreen, ScreenConfig, ScreenInfo } from './lib/types'
import { SCREEN_ROUTE } from './route'

const SCREEN_TRANSITION = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
} as const

const SCREEN_MAP = new Map<AppScreen, ScreenInfo>()

const flattenTree = (config: ScreenConfig, depth = 0, parentId: AppScreen | null = null) => {
  SCREEN_MAP.set(config.id, { depth, parentId })
  config.children?.forEach((child) => flattenTree(child, depth + 1, config.id))
}

flattenTree(SCREEN_ROUTE)

export const ScreenRouter = ({ children }: { children: ReactNode[] }) => {
  const currentScreen = useGameStore((state) => state.currentScreen)
  const currentInfo = SCREEN_MAP.get(currentScreen)

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return null

        const screenId = (child.type as any).screenId as AppScreen
        const targetInfo = SCREEN_MAP.get(screenId)
        if (!targetInfo || !currentInfo) return null
        
        const isActive = currentScreen === screenId
        const isAncestor = targetInfo.depth < currentInfo.depth

        return (
          <motion.div
            key={screenId}
            initial={{
              x: isActive ? 0 : isAncestor ? '-15%' : '100%',
              scale: isActive ? 1 : isAncestor ? 0.92 : 1,
            }}
            animate={{
              x: isActive ? 0 : isAncestor ? '-15%' : '100%',
              scale: isActive ? 1 : isAncestor ? 0.92 : 1,
              filter: isActive ? 'brightness(1)' : isAncestor ? 'brightness(0.5)' : 'brightness(1)',
              zIndex: targetInfo.depth,
            }}
            transition={SCREEN_TRANSITION}
            className="absolute inset-0 origin-right"
            style={{ pointerEvents: isActive ? 'auto' : 'none' }} // 3. 클릭 방지 추가
          >
            {child}
          </motion.div>
        )
      })}
    </div>
  )
}
