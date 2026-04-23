import { Terminal } from '~/core'
import i18n from '~/i18n'

// HP 바 렌더링 유틸리티
export const renderHpBar = (hp: number, max: number) => {
  const size = 10
  const ratio = Math.max(0, Math.min(1, hp / max))
  const filled = Math.round(ratio * size)
  return `[${'■'.repeat(filled)}${'□'.repeat(size - filled)}]`
}

export const selectTarget = async (subChoices: { name: string; message: string }[]) => {
  subChoices.push({ name: 'back', message: i18n.t('cancel') })

  return await Terminal.select(i18n.t('commands.look.select_target_prompt'), subChoices)
}
