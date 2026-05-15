import { Info } from 'lucide-react' // 아이콘 추가
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '~/hooks/useGame'
import { useGameStore } from '~/stores/useGameStore'
import { ThemedHeader } from './common/ThemedHeader'
import { ConfigField } from './config/ConfigField'
import { ScreenComponent } from './lib/types'

export const ConfigScreen: ScreenComponent = () => {
  const { getConfig, updateConfig } = useGame()
  const { t } = useTranslation()
  const { screenHistory, setScreen, backScreen } = useGameStore((state) => state)

  const currentScreen = screenHistory[screenHistory.length - 1]
  const isOpenConfigMenu = currentScreen === 'CONFIG'

  const [config, setConfig] = useState({
    isSearchFirst: false,
    visibleBattle: true,
    isAutoInputFocus: false,
    volume: 0.5,
    isMute: false,
  })

  useEffect(() => {
    if (isOpenConfigMenu) {
      const saved = getConfig()
      setConfig({
        isSearchFirst: saved.isSearchFirst || false,
        visibleBattle: saved.visibleBattle ?? true,
        isAutoInputFocus: saved.isAutoInputFocus || false,
        volume: saved.volume ?? 0.5,
        isMute: saved.isMute || false,
      })
    }
  }, [isOpenConfigMenu, getConfig])

  const handleUpdate = (nextConfig: typeof config) => {
    setConfig(nextConfig)
    updateConfig(nextConfig)
  }

  const configSections = [
    {
      subtitle: 'System Configuration',
      items: [
        {
          type: 'toggle' as const,
          key: 'isSearchFirst' as const,
          label: t('web.config.move.label'),
          description: t('web.config.move.description'),
        },
        {
          type: 'toggle' as const,
          key: 'isAutoInputFocus' as const,
          label: t('web.config.focus.label'),
          description: t('web.config.focus.description'),
        },
        {
          type: 'toggle' as const,
          key: 'visibleBattle' as const,
          label: t('web.config.battle.label'),
          description: t('web.config.battle.description'),
        },
      ],
    },
    {
      subtitle: 'Audio Systems',
      items: [
        {
          type: 'slider' as const,
          key: 'volume' as const,
          muteKey: 'isMute' as const,
          label: t('web.config.audio.label') || 'Master Volume',
          description: t('web.config.audio.description'),
        },
      ],
    },
    {
      subtitle: 'Information',
      items: [
        {
          type: 'menu' as const,
          key: 'credits',
          label: 'Credits',
          description: 'Developers, Assets, and Licenses',
          icon: <Info size={16} />,
          onClick: () => setScreen('CREDIT'),
        },
      ],
    },
  ]

  const handleFullscreenClick = () => {
    const isTauri = !!(window as any).__TAURI_INTERNALS__
    if (isTauri) return

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
    <div className="flex h-full flex-col bg-grey-900 text-primary select-none font-mono">
      <ThemedHeader title="CONFIG" onBack={backScreen} />

      <div className="lg:border lg:border-primary/50 lg:rounded-2xl lg:max-w-[480px] w-full mx-auto flex-1 overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 space-y-8">
          {configSections.map((section) => (
            <section key={section.subtitle} className="space-y-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 px-1">
                {section.subtitle}
              </h3>

              <div className="space-y-6">
                {section.items.map((item) => (
                  <ConfigField key={item.key} item={item} config={config} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer
        onClick={handleFullscreenClick}
        className="mt-auto px-5 py-4 text-[10px] text-primary/20 text-right font-mono uppercase cursor-pointer hover:text-primary/40 transition-colors"
      >
        Terminal-Tester v1.0.0 // Build 2026.03
      </footer>
    </div>
  )
}

ConfigScreen.screenId = 'CONFIG'
