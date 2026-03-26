import React from 'react'
import { Check } from 'lucide-react'

interface ThemedToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export const ThemedToggle: React.FC<ThemedToggleProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <div
      className={`
        relative min-w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer
        ${checked ? 'bg-primary' : 'bg-grey-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div
        className={`
          absolute top-1 left-1 w-4 h-4 rounded-full bg-white flex items-center justify-center transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        {checked && <Check size={10} className="text-primary stroke-[4px]" />}
      </div>
    </div>
  )
}
