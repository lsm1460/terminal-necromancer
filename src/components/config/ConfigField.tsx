import { Eye, EyeOff, Sun, Volume2, VolumeX } from 'lucide-react'
import { ConfigItem } from './ConfigItem'
import { ConfigMenu } from './ConfigMenu'
import { ConfigSliderToggle } from './ConfigSliderToggle'

interface ConfigFieldProps {
  item: any // 구체적인 타입을 정의하면 더 좋습니다
  config: any
  onUpdate: (nextConfig: any) => void
}

export const ConfigField: React.FC<ConfigFieldProps> = ({ item, config, onUpdate }) => {
  switch (item.type) {
    case 'toggle':
      return (
        <ConfigItem
          label={item.label}
          description={item.description}
          checked={config[item.key]}
          onToggle={(checked) => onUpdate({ ...config, [item.key]: checked })}
        />
      )

    case 'slider': {
      let activeIcon = <Eye size={16} />
      let inactiveIcon = <EyeOff size={16} />

      if (item.key === 'volume') {
        activeIcon = <Volume2 size={16} />
        inactiveIcon = <VolumeX size={16} />
      }

      const muteKey = item.muteKey || 'isMute'

      return (
        <ConfigSliderToggle
          label={item.label}
          description={item.description}
          value={config[item.key]}
          isToggled={config[muteKey]}
          onValueChange={(val) => onUpdate({ ...config, [item.key]: val, [muteKey]: false })}
          onToggleChange={(toggled) => onUpdate({ ...config, [muteKey]: toggled })}
          activeIcon={activeIcon}
          inactiveIcon={inactiveIcon}
        />
      )
    }

    case 'menu':
      return <ConfigMenu label={item.label} description={item.description} icon={item.icon} onClick={item.onClick} />

    default:
      return null
  }
}
