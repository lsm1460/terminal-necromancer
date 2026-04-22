import _ from 'lodash'
import { Terminal } from '~/core/Terminal'
import { GameContext } from '~/core/types'
import i18n from '~/i18n'
import GolemWrapper from '~/systems/job/necromancer/GolemWrapper'
import KnightWrapper from '~/systems/job/necromancer/KnightWrapper'
import { BattleTarget } from '~/types'
import { renderHpBar, selectTarget } from './utils'

// 미니언 및 몬스터 정보 출력
export const printEntity = (target: BattleTarget, context: GameContext) => {
  const { npcs, npcSkills } = context

  const isMinion = target.isMinion
  const isNpc = target.isNpc
  const hpBar = renderHpBar(target.hp, target.maxHp)

  const typeTag = isMinion
    ? i18n.t('commands.look.entity.type_tag.minion')
    : isNpc
      ? i18n.t('commands.look.entity.type_tag.npc')
      : i18n.t('commands.look.entity.type_tag.monster')

  // SKILL_LIST에서 실제 스킬 객체 로드
  const skillDetails = (target.skills || []).map((id) => npcSkills.getSkill(id)).filter(Boolean)

  Terminal.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  Terminal.log(`${typeTag} ${target.name}`)
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  // 기본 스탯 출력
  Terminal.log(i18n.t('commands.look.entity.stats.hp', { hpBar, hp: target.hp, maxHp: target.maxHp }))
  Terminal.log(
    i18n.t('commands.look.entity.stats.combat', {
      atk: target.atk.toString().padEnd(3),
      def: target.def.toString().padEnd(3),
      agi: target.agi.toString().padEnd(3),
    })
  )

  // 부가 스탯 출력
  if (target.eva || target.crit) {
    Terminal.log(
      i18n.t('commands.look.entity.stats.sub', {
        eva: Math.floor((target.eva || 0) * 100),
        crit: Math.floor((target.crit || 0) * 100),
      })
    )
  }

  if (target.isGolem) {
    printGolem(target)
  }

  if (target.isKnight) {
    printKnight(target)
  }

  // 스킬 목록 출력
  if (skillDetails.length > 0) {
    Terminal.log(`──────────────────────────────────────────────`)
    Terminal.log(i18n.t('commands.look.entity.skills.label'))
    skillDetails.forEach((skill) => {
      Terminal.log(
        i18n.t('commands.look.entity.skills.item', {
          name: skill.name,
          description: skill.description,
        })
      )
    })
  }

  Terminal.log(`──────────────────────────────────────────────`)
  Terminal.log(` 💬 "${target.description}"`)
  Terminal.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  const canTalk = isNpc || target.isKnight

  if (canTalk) {
    let name = target.name
    if (target.isKnight) {
      name = npcs.getNPC('_knight')?.name || ''
    }

    Terminal.talk(name)
  }
}

export const printGolem = (target: BattleTarget) => {
  const golem = target as GolemWrapper
  const upgrades = golem.upgrade || []
  const limit = golem.upgradeLimit || 0
  const currentCount = upgrades.length

  Terminal.log(`──────────────────────────────────────────────`)
  const barLength = 10
  const filledLength = limit > 0 ? Math.round((currentCount / limit) * barLength) : 0
  const bar = '■'.repeat(filledLength) + '□'.repeat(Math.max(0, barLength - filledLength))

  // 성장도 로그 출력
  Terminal.log(
    i18n.t('commands.look.golem.growth_label', {
      bar,
      current: currentCount,
      limit,
    })
  )

  if (currentCount > 0) {
    const counts = _.countBy(upgrades)
    const machineLv = counts['machine'] || 0
    const soulLv = counts['soul'] || 0

    if (machineLv > 0) Terminal.log(i18n.t('commands.look.golem.upgrades.machine', { level: machineLv }))
    if (soulLv > 0) Terminal.log(i18n.t('commands.look.golem.upgrades.soul', { level: soulLv }))
  }
}

export const printKnight = (target: BattleTarget) => {
  const knight = target as KnightWrapper
  const upgrades = knight.upgrade || []
  const limit = knight.upgradeLimit || 0
  const currentCount = upgrades.length

  Terminal.log(`──────────────────────────────────────────────`)
  const barLength = 10
  const filledLength = limit > 0 ? Math.round((currentCount / limit) * barLength) : 0
  const bar = '■'.repeat(filledLength) + '□'.repeat(Math.max(0, barLength - filledLength))

  // 성장도 로그 출력
  Terminal.log(
    i18n.t('commands.look.knight.growth_label', {
      bar,
      current: currentCount,
      limit,
    })
  )

  if (currentCount > 0) {
    const counts = _.countBy(upgrades)
    const epicCount = counts['EPIC'] || 0
    const rareCount = counts['RARE'] || 0
    const commonCount = counts['COMMON'] || 0

    if (epicCount > 0) Terminal.log(i18n.t('commands.look.knight.upgrades.epic', { level: epicCount }))
    if (rareCount > 0) Terminal.log(i18n.t('commands.look.knight.upgrades.rare', { level: rareCount }))
    if (commonCount > 0) Terminal.log(i18n.t('commands.look.knight.upgrades.common', { level: commonCount }))
  }
}

export const lookBattleTarget = async (targets: BattleTarget[], context: GameContext) => {
  const subChoices = targets.map((t) => ({ name: t.id, message: `${t.name} (hp: ${t.hp}/${t.maxHp})` }))

  const selected = await selectTarget(subChoices)

  if (selected !== 'back') {
    const target = targets.find((t) => t.id === selected)
    if (target) printEntity(target, context)
  }

  return selected
}
