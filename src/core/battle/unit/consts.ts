import i18n from '~/i18n'
import { BuffOptions } from '../Buff'

export const getBuffMessage = (id: BuffOptions['id']) => {
  const isBuff = ['overdrive', 'grace'].includes(id)
  const path = isBuff ? 'skill.message.buff' : 'skill.message.debuff'
  const fullPath = `${path}.${id}`

  if (!i18n.exists(fullPath)) {
    return
  }

  return (name: string, hp?: number, maxHp?: number) =>
    i18n.t(fullPath, {
      name,
      hp: hp?.toString(),
      maxHp: maxHp?.toString(),
    })
}
