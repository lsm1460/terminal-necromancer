import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { speak } from '~/utils'

export const handlePromotion = async (context: GameContext) => {
  const { player, events } = context
  const necromancer = player as Necromancer
  const isDead = events.isCompleted('caron_is_dead')
  const npcKey = isDead ? 'caron_is_dead' : 'caron_is_mine'
  const getMsg = (key: string, p?: any) => i18n.t(`npc.subspace.promotion.${npcKey}.${key}`, p) as string

  const selectedId = await Terminal.select(i18n.t('npc.subspace.promotion.select_title'), [
    ...necromancer.skeleton.map((sk) => ({
      name: sk.id,
      message: i18n.t('skill.choice_format', { name: sk.name, hp: sk.hp, maxHp: sk.maxHp }),
      disabled: sk.maxHp < 200,
    })),
    { name: 'cancel', message: i18n.t('cancel') },
  ])

  if (selectedId === 'cancel') return

  const target = necromancer.skeleton.find((sk) => sk.id === selectedId)!
  if (await Terminal.confirm(getMsg('confirm', { name: target.name }))) {
    necromancer.unlockKnight(target)
    necromancer.removeMinion(selectedId)
    Terminal.log(getMsg('success'))
    Terminal.log(i18n.t('npc.subspace.promotion.system.result', { name: target.name }))
  }
}

export const handleTutorialPromotion = async (context: GameContext) => {
  const { events } = context
  const isDead = events.isCompleted('caron_is_dead')
  const npcKey = isDead ? 'caron_is_dead' : 'caron_is_mine'

  // 튜토리얼 대사 실행 (발견의 강조)
  const lines = i18n.t(`npc.subspace.promotion.tutorial.${npcKey}`, { returnObjects: true }) as string[]
  await speak(lines)

  events.completeEvent('tutorial_knight')
}
