import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import { Necromancer } from '~/systems/job/necromancer/Necromancer'
import { NPC } from '~/types'
import { delay } from '~/utils'

export const FlintActions = {
  async handleEncounter(npc: NPC, context: GameContext) {
    const { events } = context
    const descColor = '\x1b[36m'

    const initialScript = i18n.t('npc.flint.encounter.initial_script', { returnObjects: true }) as {
      delay?: number
      name?: string
      text: string
    }[]

    for (const line of initialScript) {
      if (!line.name) {
        Terminal.log(`  ${descColor}${line.text}\x1b[0m`)
      } else {
        Terminal.log(`${line.name}: "${line.text}"`)
      }
      await delay(line.delay || 1500)
    }

    const mainChoice = await Terminal.select(i18n.t('npc.flint.encounter.select_action'), [
      { name: 'ask_situation', message: i18n.t('npc.flint.encounter.choice_ask') },
      { name: 'surprise_attack', message: i18n.t('npc.flint.encounter.choice_surprise') },
    ])

    if (mainChoice === 'surprise_attack') {
      return await handleSurpriseAttack(npc, context)
    }

    await handleAskSituation(npc, context)
    events.completeEvent('b5_flint')
    return true
  },
}

async function handleSurpriseAttack(npc: NPC, context: GameContext) {
  const { battle, world, currentTile } = context
  Terminal.log(`  \x1b[31m${i18n.t('npc.flint.encounter.surprise_attack_msg')}\x1b[0m`)
  await delay(1000)
  Terminal.log(i18n.t('npc.flint.encounter.surprise_attack_reply'))

  const isWin = await battle.runCombatLoop([battle.toCombatUnit(npc, 'npc')], world)
  npc.updateHostility(isWin ? 40 : 10)
  currentTile.isClear = true
  return true
}

async function handleAskSituation(npc: NPC, context: GameContext) {
  const { player, drop } = context
  Terminal.log(i18n.t('npc.flint.encounter.ask_reply_1'))
  await delay(1000)
  Terminal.log(i18n.t('npc.flint.encounter.ask_reply_2'))

  const finalDecision = await Terminal.select(i18n.t('npc.flint.encounter.select_final'), [
    { name: 'join', message: i18n.t('npc.flint.encounter.choice_join') },
    { name: 'refuse', message: i18n.t('npc.flint.encounter.choice_refuse') },
  ])

  if (finalDecision === 'join') {
    Terminal.log(i18n.t('npc.flint.encounter.result_join'))
    const { drops: goods } = drop.generateDrops('b5_flint_medical_kit')
    npc.updateContribution(25)
    player.addItem(goods[0])
    player.karma += 5
  } else {
    Terminal.log(i18n.t('npc.flint.encounter.result_refuse'))
    npc.updateContribution(-20)
    npc.updateHostility(30)
  }
}
