import { Terminal } from '~/core'
import i18n from '~/i18n'
import { Corpse } from '~/types'
import { selectTarget } from './utils'

export const lookCorpse = async (corpse: Corpse[]) => {
  const subChoices = corpse.map((c) => ({
    name: c.id,
    message: i18n.t('commands.look.corpse.menu_label', { name: c.name }),
  }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = corpse.find((c) => c.id === selected)

    if (target) {
      const { name, maxHp, atk, def } = target

      // 상세 설명 로그
      Terminal.log(i18n.t('commands.look.corpse.description', { name }))

      // 능력치 정보 로그
      Terminal.log(i18n.t('commands.look.corpse.status_header', { name }))
      Terminal.log(i18n.t('commands.look.corpse.hp', { maxHp }))
      Terminal.log(i18n.t('commands.look.corpse.atk', { atk }))
      Terminal.log(i18n.t('commands.look.corpse.def', { def }))
      Terminal.log(i18n.t('commands.look.corpse.footer'))
    }
  }

  return selected
}
