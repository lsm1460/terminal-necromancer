import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { ThemedButton } from './ThemedButton'

interface ThemedHeaderProps {
  title: string
  onBack?: () => void
  rightElement?: React.ReactNode
}

export const ThemedHeader: React.FC<ThemedHeaderProps> = ({ title, onBack, rightElement }) => {
  return (
    <header className="flex items-center gap-2 border-primary/20 px-3 py-2">
      {onBack && (
        <ThemedButton.round className="bg-transparent" onClick={onBack}>
          <ArrowLeft size={18} strokeWidth={2.5} />
        </ThemedButton.round>
      )}
      <h2 className="text-base flex-1">{title}</h2>
      {rightElement && <div>{rightElement}</div>}
    </header>
  )
}
