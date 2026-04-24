import cloneDeep from 'lodash/cloneDeep'
import i18n from '~/i18n'
import { Monster, MonsterGroupMember, Tile } from './types'
import { generateId } from './utils'

export class MonsterFactory {
  private monster: Record<string, Monster> = {}
  private group: Record<string, MonsterGroupMember[]> = {}

  constructor(groupData: any, monsterData: any) {
    this.group = groupData
    this.monster = monsterData
  }

  spawn(tile: Tile): Monster | null {
    if (!tile.event.startsWith('monster')) return null

    const group = this.group[tile.event]
    if (!group?.length) return null

    const totalRate = group.reduce((sum, m) => sum + (m.encounterRate ?? 0), 0)

    if (totalRate <= 0) return null

    if (totalRate < 100) {
      const appearRoll = Math.random() * 100
      if (appearRoll >= totalRate) return null
    }

    const roll = Math.random() * totalRate

    let acc = 0
    const selected = group.find((m) => {
      acc += m.encounterRate ?? 0
      return roll < acc
    })

    if (!selected) return null

    const baseMonster = this.makeMonster(selected.id)
    return baseMonster || null
  }

  makeMonsters(groupName: string): Monster[] {
    const group = this.group[groupName] || []
    return group.map((member) => this.makeMonster(member.id)).filter(Boolean) as Monster[]
  }

  makeMonster(monsterId: string): Monster | void {
    if (!this.monster[monsterId]) {
      console.warn(`[MonsterFactory] 존재하지 않는 몬스터 ID: ${monsterId}`)
      return
    }

    const base = cloneDeep(this.monster[monsterId])
    
    return {
      ...base,
      isAlive: true,
      id: generateId(base.id),

      get name() {
        return i18n.t(`npc.${base.id}.name`)
      },
      get description() {
        return i18n.t(`npc.${base.id}.description`)
      }
    }
  }
}
