import { useEffect, useState } from 'react'
import { GameEngine } from '~/gameEngine'
import { useGameStore } from '~/stores/useGameStore'
import { SaveSystem } from '~/systems/SaveSystem'
import { ThemedHeader } from './common/ThemedHeader'
import { ConfigItem } from './config/ConfigItem'
import { useTranslation } from 'react-i18next'

export const ConfigScreen: React.FC<{
  engine: React.RefObject<GameEngine | null>
}> = ({ engine }) => {
  const { t } = useTranslation()
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
          label: t('web.config.move.label'),
          description: t('web.config.move.description'),
        },
      ],
    },
  ]

  const handleFullscreenClick = () => {
    // 1. Tauri 환경인지 체크 (데스크톱 앱일 경우 실행 방지)
    const isTauri = !!(window as any).__TAURI_INTERNALS__
    if (isTauri) return

    // 2. 브라우저 전체화면 API 실행
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`전체 화면 전환 실패: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return (
    <div className="flex h-full flex-col bg-grey-900 text-primary select-none">
      <ThemedHeader title="CONFIG" onBack={toggleConfigMenu} />

      <div className="lg:border lg:border-primary/50 lg:rounded-2xl lg:max-w-[480px] w-full mx-auto">
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
      </div>

      <footer
        onClick={handleFullscreenClick}
        className="mt-auto px-5 py-4 text-[10px] text-primary/20 text-right font-mono uppercase"
      >
        Terminal-Tester v1.0.4 // Build 2026.03
      </footer>
    </div>
  )
}
