import i18n from '~/i18n'
import { BuffOptions } from '../Buff'

export const getBuffMessage = (id: BuffOptions['id']) => {
  const isBuff = ['overdrive'].includes(id)
  const path = isBuff ? 'skill.message.buff' : 'skill.message.debuff'

  return (name: string, hp?: number, maxHp?: number) => {
    return i18n.t(`${path}.${id}`, {
      name,
      hp: hp?.toString(),
      maxHp: maxHp?.toString(),
    })
  }
}
