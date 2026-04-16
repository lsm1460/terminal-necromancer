import fs from 'fs'
import { GameEventType } from '~/types/event'
import { EventBus } from './EventBus'
import { SkeletonRarity } from '~/consts'
import i18n from '~/i18n'

type Achievement = {
  id: string
  hidden: boolean
  resolved?: boolean
  date?: string
}

export class AchievementManager {
  private isWeb = typeof window !== 'undefined'
  private achievements: Achievement[] = []
  private achievementsPath: string = ''

  constructor(
    private eventBus: EventBus,
    initialData: {
      achievements: Achievement[]
    },
    achievementsPath?: string
  ) {
    if (!this.isWeb && achievementsPath) {
      this.achievementsPath = achievementsPath
    }

    const saved = this.load()

    this.achievements = initialData.achievements.map((a) => ({
      ...a,
      resolved: saved[a.id] ? true : false,
      date: saved[a.id] ?? '',
    }))

    eventBus.subscribe(GameEventType.NPC_IS_DEAD, this.onNPCDead)
    eventBus.subscribe(GameEventType.COMPLETE_EVENT, this.onEventCleared)
    eventBus.subscribe(GameEventType.SKILL_RAISE_SKELETON_SUCCESS, this.onSkeletonRaised)
    eventBus.subscribe(GameEventType.UPDATE_FACTION_CONTRIBUTION, this.onUpdateFactionContribution)
  }

  private load() {
    if (this.isWeb) {
      const saved = localStorage.getItem('terminal_game_achievements')
      if (saved) return JSON.parse(saved)
      return
    } else {
      if (!this.achievementsPath || !fs.existsSync(this.achievementsPath)) return
      return JSON.parse(fs.readFileSync(this.achievementsPath, 'utf-8'))
    }
  }

  private save() {
    const now = new Date().toISOString().split('T')[0] // YYYY-MM-DD 형식

    const dataToSave = this.achievements.reduce(
      (acc, a) => {
        if (a.resolved) {
          acc[a.id] = a.date || now
        }
        return acc
      },
      {} as Record<string, string>
    )

    try {
      if (this.isWeb) {
        localStorage.setItem('terminal_game_achievements', JSON.stringify(dataToSave))
      } else {
        if (!this.achievementsPath) {
          throw new Error('achievementsPath is undefined')
        }

        fs.writeFileSync(this.achievementsPath, JSON.stringify(dataToSave, null, 2), 'utf-8')
      }
    } catch (error) {
      console.error('업적 저장 중 오류 발생:', error)
    }
  }

  private unlock(id: string) {
    const achievement = this.achievements.find((a) => a.id === id)
    if (achievement && !achievement.resolved) {
      achievement.resolved = true

      // 토스트 알림 등을 위해 이벤트 발행 (ToastManager가 수신)
      this.eventBus.emitAsync(GameEventType.SHOW_TOAST, {
        message: `[업적 달성] ${i18n.t(`achievement.${achievement.id}.title`)}`,
        type: 'ACHIEVEMENT',
      })

      this.save()
    }
  }

  getAchievements() {
    return this.achievements.map((a) => ({
      ...a,
      title: a.hidden && !a.resolved ? '???' : i18n.t(`achievement.${a.id}.title`),
      description:
        a.hidden && !a.resolved ? '아직 알려지지 않은 기록입니다.' : i18n.t(`achievement.${a.id}.description`),
    }))
  }

  onNPCDead = ({ npcId }: { npcId: string }) => {
    if (npcId === 'ratty') this.unlock('RATTY_SILENCED')
  }
  onEventCleared = (eventId: string) => {
    if (eventId === 'caron_is_dead') this.unlock('CARON_DEAD')
    if (eventId === 'caron_is_mine') this.unlock('CARON_PARTNER')
  }

  onSkeletonRaised = ({ rarity }: { rarity: SkeletonRarity }) => {
    if (rarity === 'legendary') this.unlock('LEGENDARY_RAISER')
  }

  onUpdateFactionContribution = ({ faction, amount }: { faction: string; amount: number }) => {
    if (faction === 'resistance' && amount >= 200) {
      this.unlock('RESISTANCE_HERO')
    }
  }
}
