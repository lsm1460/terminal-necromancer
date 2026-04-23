import { Terminal } from '~/core'
import { CommandFunction, GameContext } from '~/core/types'
import i18n from '~/i18n'
import { ItemType } from '~/types/item'

export type ItemFormatterFn = (item: any, baseText: string) => string
export type StatusExtensionFn = (args: string[]) => void

const defaultStatusRender = (args: string[], { player }: GameContext, itemFormatter?: ItemFormatterFn) => {
  const { atk: originAtk, def: originDef } = player
  const { atk, def, crit, eva, hp, mp, maxHp, maxMp, gold, level, exp, equipped } = player.computed

  Terminal.log(i18n.t('commands.look.status.title'))
  Terminal.log(i18n.t('commands.look.status.level', { level, exp }))

  const { required: expNeeded } = player.expToNextLevel()
  if (expNeeded !== null) {
    Terminal.log(i18n.t('commands.look.status.exp_next', { expNeeded }))
  } else {
    Terminal.log(i18n.t('commands.look.status.max_level'))
  }

  Terminal.log(i18n.t('commands.look.status.hp', { hp, maxHp }))
  Terminal.log(i18n.t('commands.look.status.mp', { mp, maxMp }))
  Terminal.log(i18n.t('commands.look.status.atk', { atk, bonus: atk - originAtk }))
  Terminal.log(i18n.t('commands.look.status.def', { def, bonus: def - originDef }))
  Terminal.log(i18n.t('commands.look.status.gold', { gold: gold.toLocaleString() + 'G' }))

  Terminal.log(i18n.t('commands.look.status.crit', { val: Math.floor(crit * 100) }))
  Terminal.log(i18n.t('commands.look.status.eva', { val: Math.floor(eva * 100) }))

  // 장비 정보 렌더링 헬퍼 (무기/방어구 공통 로직)
  const renderEquip = (type: 'weapon' | 'armor') => {
    const item = equipped[type]
    const isMatchedType = type === 'weapon' ? ItemType.WEAPON : ItemType.ARMOR

    let text = i18n.t('commands.look.status.equipment.none')

    if (item && item.type === isMatchedType) {
      const bonusKey = type === 'weapon' ? 'bonus_atk' : 'bonus_def'
      const statKey = type === 'weapon' ? 'atk' : 'def'

      text = i18n.t(`commands.look.status.equipment.${bonusKey}`, {
        label: item.name,
        [statKey]: (item as any)[statKey],
      }) as string

      if (itemFormatter) {
        text = itemFormatter(item, text)
      }
    }
    Terminal.log(i18n.t(`commands.look.status.equipment.${type}`, { text }))
  }

  renderEquip('weapon')
  renderEquip('armor')
}

export const createStatusCommand = (options?: {
  extension?: StatusExtensionFn
  itemFormatter?: ItemFormatterFn
}): CommandFunction => {
  return (args, context) => {
    // 1. 공통 기본 스탯 출력
    defaultStatusRender(args, context, options?.itemFormatter)

    // 2. 주입된 확장 정보 출력 (예: 군단 상태 등)
    if (options?.extension) {
      options.extension(args)
    }

    Terminal.log(i18n.t('commands.look.status.footer'))
    return false
  }
}

export const statusCommand = createStatusCommand()
