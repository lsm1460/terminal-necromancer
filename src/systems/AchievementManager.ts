import { GameEventType } from '~/types/event'
import { EventBus } from './EventBus'
import { SkeletonRarity } from '~/consts'

type Achievement = {
  id: string
  title: string
  description: string
  hidden: boolean
  resolved?: boolean
}

export class AchievementManager {
  private achievements: Achievement[] = []

  constructor(
    private eventBus: EventBus,
    initialData: {
      achievements: Achievement[]
    }
  ) {
    this.achievements = initialData.achievements.map((a) => ({
      ...a,
      resolved: false,
    }))

    eventBus.subscribe(GameEventType.NPC_IS_DEAD, this.onNPCDead)
    eventBus.subscribe(GameEventType.COMPLETE_EVENT, this.onEventCleared)
    eventBus.subscribe(GameEventType.SKILL_RAISE_SKELETON_SUCCESS, this.onSkeletonRaised)
    eventBus.subscribe(GameEventType.UPDATE_FACTION_CONTRIBUTION, this.onUpdateFactionContribution)
  }

  private unlock(id: string) {
    const achievement = this.achievements.find((a) => a.id === id)
    if (achievement && !achievement.resolved) {
      achievement.resolved = true

      // 토스트 알림 등을 위해 이벤트 발행 (ToastManager가 수신)
      this.eventBus.emitAsync(GameEventType.SHOW_TOAST, {
        message: `[업적 달성] ${achievement.title}`,
        type: 'ACHIEVEMENT',
      })

      // SaveSystem.save() 호출 로직이 여기 들어가면 좋음
    }
  }

  getAchievements() {
    return this.achievements.map((a) => ({
      ...a,
      title: a.hidden && !a.resolved ? '???' : a.title,
      description: a.hidden && !a.resolved ? '아직 알려지지 않은 기록입니다.' : a.description,
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
