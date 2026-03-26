import React from 'react'
import { ThemedToggle } from '../common/ThemedToggle'

interface ConfigItemProps {
  label: string
  description: string
  checked: boolean
  onToggle: (checked: boolean) => void
}

export const ConfigItem: React.FC<ConfigItemProps> = ({ label, description, checked, onToggle }) => {
  return (
    <div className="group flex items-center justify-between cursor-pointer gap-4" onClick={() => onToggle(!checked)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs xl:text-sm">{label}</span>
        </div>
        <p className="text-[10px] text-primary/50 leading-relaxed break-keep">{description}</p>
      </div>

      <ThemedToggle checked={checked} onChange={onToggle} />
    </div>
  )
}
