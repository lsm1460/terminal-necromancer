import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { SaveSystem } from '~/systems/SaveSystem'
import { ThemedButton } from './common/ThemedButton'
import { ConfigItem } from './config/ConfigItem'
import { ThemedHeader } from './common/ThemedHeader'

export const ConfigScreen: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const { isOpenConfigMenu, toggleConfigMenu } = useGameStore((state) => state)

  // 설정 상태 관리
  const [config, setConfig] = useState({
    isSearchFirst: false,
  })

  useEffect(() => {
    if (engine.current) {
      const currentConfig = engine.current.context.config || {}
      setConfig({
        isSearchFirst: currentConfig.isSearchFirst || false,
      })
    }
  }, [isOpenConfigMenu, engine])

  const saveConfig = (newConfig: typeof config) => {
    if (!engine.current) return

    const { player, context } = engine.current
    context.config = { ...context.config, ...newConfig }

    const saveData = SaveSystem.makeSaveData(player, context)
    context.save.save(saveData)
  }

  const handleToggle = (key: keyof typeof config) => (checked: boolean) => {
    const nextConfig = { ...config, [key]: checked }
    setConfig(nextConfig)
    saveConfig(nextConfig)
  }

  // 설정 항목 정의 (섹션별 그룹화)
  const configSections = [
    {
      subtitle: 'Movement Control',
      items: [
        {
          key: 'isSearchFirst' as const,
          label: '이동 전 미리보기',
          description: '버튼으로 타일을 이동하기 전에 해당 칸의 정보를 먼저 확인합니다.',
        },
      ],
    },
  ]

  return (
    <div className="flex h-full flex-col bg-grey-900 text-primary select-none">
      <ThemedHeader title='CONFIG' onBack={toggleConfigMenu}/>

      <main className="flex-1 overflow-y-auto p-4 space-y-8">
        {configSections.map((section) => (
          <section key={section.subtitle} className="space-y-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 px-1">
              {section.subtitle}
            </h3>

            <div className="space-y-6">
              {section.items.map((item) => (
                <ConfigItem
                  key={item.key}
                  label={item.label}
                  description={item.description}
                  checked={config[item.key]}
                  onToggle={handleToggle(item.key)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="px-5 py-4 text-[10px] text-primary/20 text-right font-mono uppercase">
        Terminal-Tester v1.0.4 // Build 2026.03
      </footer>
    </div>
  )
}
