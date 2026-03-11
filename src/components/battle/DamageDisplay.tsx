import { motion, AnimatePresence } from 'framer-motion'

interface DamageDisplayProps {
  damage: number
  isCritical?: boolean
  type?: 'normal' | 'heal' | 'poison' // 타입별 색상 확장용
}

export const DamageDisplay = ({ damage, isCritical, type = 'normal' }: DamageDisplayProps) => {
  const getStyle = () => {
    if (type === 'heal') return 'text-green-400 [text-shadow:2px_2px_0_#000]'
    if (type === 'poison') return 'text-purple-500 [text-shadow:2px_2px_0_#000]'
    if (isCritical) return 'text-yellow-400 text-3xl [text-shadow:2px_2px_0_#000,4px_4px_0_#b91c1c]'
    return 'text-white text-xl [text-shadow:2px_2px_0_#000]'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 0, scale: 0.5 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: -50,
          scale: isCritical ? [1, 1.5, 1.2] : 1,
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`absolute left-1/2 -translate-x-1/2 pointer-events-none select-none font-black z-50 flex flex-col items-center ${getStyle()}`}
      >
        {isCritical && <span className="text-xs italic tracking-tighter mb-[-4px] animate-pulse">CRITICAL!</span>}
        <span className="font-mono">
          {type === 'heal' ? `+${damage}` : damage}
          {isCritical && '!!'}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
