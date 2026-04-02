import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '~/hooks/useGame'
import { useGameStore } from '~/stores/useGameStore'
import { ThemedHeader } from './common/ThemedHeader'
import { ConfigItem } from './config/ConfigItem'

export const ConfigScreen: React.FC = () => {
  const { getConfig, updateConfig } = useGame()
  const { t } = useTranslation()
  const { isOpenConfigMenu, toggleConfigMenu } = useGameStore((state) => state)

  // 설정 상태 관리
  const [config, setConfig] = useState({
    isSearchFirst: false,
    isAutoInputFocus: false,
  })

  useEffect(() => {
    if (isOpenConfigMenu) {
      const { isSearchFirst, isAutoInputFocus } = getConfig()
      setConfig({ 
        isSearchFirst: isSearchFirst || false,
        isAutoInputFocus: isAutoInputFocus || false,
      })
    }
  }, [isOpenConfigMenu, getConfig])

  const handleToggle = (key: keyof typeof config) => (checked: boolean) => {
    const nextConfig = { ...config, [key]: checked }

    setConfig(nextConfig)

    updateConfig(nextConfig)
  }

  const configSections = [
    {
      subtitle: 'Interface & Control',
      items: [
        {
          key: 'isSearchFirst' as const,
          label: t('web.config.move.label'),
          description: t('web.config.move.description'),
        },
        {
        key: 'isAutoInputFocus' as const,
        label: t('web.config.focus.label'),
        description: t('web.config.focus.description'),
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
