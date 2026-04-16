import { ChevronRight, Info } from 'lucide-react'; // 아이콘 추가
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGame } from '~/hooks/useGame'
import { useGameStore } from '~/stores/useGameStore'
import { ThemedHeader } from './common/ThemedHeader'
import { ConfigItem } from './config/ConfigItem'
import { ScreenComponent } from './lib/types'

export const ConfigScreen: ScreenComponent = () => {
  const { getConfig, updateConfig } = useGame()
  const { t } = useTranslation()
  const { screenHistory, setScreen, backScreen } = useGameStore((state) => state)

  const currentScreen = screenHistory[screenHistory.length - 1]
  const isOpenConfigMenu = currentScreen === 'CONFIG'
  
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
      type: 'toggle',
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
    {
      subtitle: 'Information',
      type: 'menu',
      items: [
        {
          key: 'credits',
          label: 'Credits',
          description: 'Developers, Assets, and Licenses',
          icon: <Info size={16} />,
          onClick: () => setScreen('CREDIT'),
        },
      ],
    },
  ] as const

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
    <div className="flex h-full flex-col bg-grey-900 text-primary select-none">
      <ThemedHeader title="CONFIG" onBack={backScreen} />

      <div className="lg:border lg:border-primary/50 lg:rounded-2xl lg:max-w-[480px] w-full mx-auto flex-1 overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 space-y-8">
          {configSections.map((section) => (
            <section key={section.subtitle} className="space-y-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 px-1">
                {section.subtitle}
              </h3>

              <div className="space-y-6">
                {section.type === 'toggle' ? (
                  // 기존 토글 아이템
                  section.items.map((item) => (
                    <ConfigItem
                      key={item.key}
                      label={item.label}
                      description={item.description}
                      checked={config[item.key as keyof typeof config]}
                      onToggle={handleToggle(item.key as keyof typeof config)}
                    />
                  ))
                ) : (
                  section.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between group px-1 py-2 hover:bg-primary/5 rounded-lg transition-colors text-left"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium">{item.label}</span>
                        </div>
                        <p className="text-[12px] text-primary/50">{item.description}</p>
                      </div>
                      <ChevronRight size={18} className="text-primary/30 group-hover:text-primary transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </section>
          ))}
        </main>
      </div>

      <footer
        onClick={handleFullscreenClick}
        className="mt-auto px-5 py-4 text-[10px] text-primary/20 text-right font-mono uppercase cursor-pointer hover:text-primary/40 transition-colors"
      >
        Terminal-Tester v1.0.4 // Build 2026.03
      </footer>
    </div>
  )
}

ConfigScreen.screenId = 'CONFIG'