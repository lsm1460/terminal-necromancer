import { Code, Heart, Image as ImageIcon, Music, Palette, Users } from 'lucide-react';
import { ReactNode } from 'react';
import { ThemedHeader } from '~/components/common/ThemedHeader'; // 기존 컴포넌트 가정
import { useGameStore } from '~/stores/useGameStore';
import { ScreenComponent } from './lib/types';

interface CreditItem {
  icon: ReactNode
  role: string
  name: string
  description?: string
}

interface CreditSection {
  subtitle: string
  items: CreditItem[]
}

export const CreditScreen: ScreenComponent = () => {
  const setScreen = useGameStore((state) => state.setScreen)

  const creditSections: CreditSection[] = [
    {
      subtitle: 'Core Development',
      items: [
        {
          icon: <Code size={16} />,
          role: 'Lead Developer',
          name: 'Sangmin',
          description: 'Architecture, Logic, and Terminal Emulation',
        },
      ],
    },
    {
      subtitle: 'Visual Assets',
      items: [
        {
          icon: <ImageIcon size={16} />,
          role: 'AI Image Generation',
          name: 'Generated with Nano Banana 2',
          description: 'Refined & Directed by Development Team',
        },
        {
          icon: <Palette size={16} />,
          role: 'UI/UX Design',
          name: 'Sangmin',
          description: 'Terminal Theme & User Experience',
        },
      ],
    },
    {
      subtitle: 'Audio & Music',
      items: [
        {
          icon: <Music size={16} />,
          role: 'Sound Effects',
          name: 'Sonniss GDC Packs',
          description: 'Royalty-Free Assets',
        },
        {
          icon: <Music size={16} />,
          role: 'Ambient Music',
          name: '[Artist Name] via FreeSound.org',
          description: 'Licensed under CC BY 4.0',
        },
      ],
    },
    {
      subtitle: 'Special Thanks',
      items: [
        {
          icon: <Users size={16} />,
          role: 'Open Source Community',
          name: 'React, Tauri, Framer Motion',
          description: 'Essential Tools that made this possible',
        },
        {
          icon: <Heart size={16} />,
          role: 'Playtesters',
          name: 'Early Supporters & Bug Hunters',
        },
      ],
    },
  ]

  const CreditInfoItem = ({ item }: { item: CreditItem }) => (
    <div className="flex items-start gap-4 py-1.5 px-1">
      <div className="mt-1 text-primary/60">{item.icon}</div>
      <div className="flex-1 space-y-0.5">
        <div className="text-[10px] uppercase font-medium tracking-wider text-primary/40">
          {item.role}
        </div>
        <div className="text-[15px] font-semibold text-primary">{item.name}</div>
        {item.description && (
          <div className="text-[12px] text-primary/70 font-mono leading-relaxed">
            {item.description}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-full flex-col bg-grey-900 text-primary select-none">
      <ThemedHeader title="CREDITS" onBack={() => setScreen('CONFIG')} />

      <div className="lg:border lg:border-primary/50 lg:rounded-2xl lg:max-w-[480px] w-full mx-auto flex-1 overflow-hidden flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 space-y-10 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {creditSections.map((section) => (
            <section key={section.subtitle} className="space-y-5">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-primary/40 px-1 border-b border-primary/10 pb-2">
                {section.subtitle}
              </h3>

              <div className="space-y-6">
                {section.items.map((item, index) => (
                  <CreditInfoItem key={`${item.role}-${index}`} item={item} />
                ))}
              </div>
            </section>
          ))}

          <div className="h-6" />
        </main>
      </div>
    </div>
  )
}

CreditScreen.screenId = 'CREDIT'