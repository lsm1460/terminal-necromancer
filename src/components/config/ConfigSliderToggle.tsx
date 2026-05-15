import React from 'react'

interface ConfigSliderToggleProps {
  label: string
  description?: string
  value: number // volume -> value (범용화)
  isToggled: boolean // isMute -> isToggled (범용화: 비활성화 상태 여부)
  onValueChange: (value: number) => void
  onToggleChange: (toggled: boolean) => void
  // 범용성을 위한 아이콘 커스텀 주입 (기본값 설정 가능)
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
}

export const ConfigSliderToggle: React.FC<ConfigSliderToggleProps> = ({
  label,
  description,
  value,
  isToggled,
  onValueChange,
  onToggleChange,
  activeIcon,
  inactiveIcon,
}) => (
  <div className="px-1 space-y-2">
    <div className="flex flex-col gap-0.5">
      <span className="text-primary font-medium leading-none">{label}</span>
      {description && <p className="text-[11px] text-primary/40 leading-normal">{description}</p>}
    </div>

    <div className="flex items-center gap-3 bg-primary/5 pl-2 pr-4 py-2 rounded-lg border border-primary/10">
      <button
        onClick={() => onToggleChange(!isToggled)}
        className={`p-1.5 rounded transition-all flex-shrink-0 ${
          isToggled ? 'bg-primary text-black' : 'hover:bg-primary/20 text-primary'
        }`}
      >
        {isToggled ? inactiveIcon : activeIcon}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        disabled={isToggled}
        value={value}
        onChange={(e) => onValueChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-primary/20 accent-primary appearance-none cursor-pointer disabled:opacity-20 transition-opacity"
      />

      <span className="text-[10px] font-mono text-cyan-400 w-8 text-right flex-shrink-0 select-none">
        {isToggled ? 'OFF' : `${Math.round(value * 100)}%`}
      </span>
    </div>
  </div>
)