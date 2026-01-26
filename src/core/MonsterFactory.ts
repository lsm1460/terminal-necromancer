// core/MonsterFactory.ts
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import { Monster, MonsterGroupMember, Tile } from '../types'
import { generateId } from '../utils'

export class MonsterFactory {
  private monster: Record<string, Monster> = {}
  private group: Record<string, MonsterGroupMember[]> = {}

  constructor(groupJsonPath: string, monsterJsonPath: string) {
    this.group = JSON.parse(fs.readFileSync(path.resolve(groupJsonPath), 'utf-8'))
    this.monster = JSON.parse(fs.readFileSync(path.resolve(monsterJsonPath), 'utf-8'))
  }

  spawn(tile: Tile): Monster | null {
    if (!tile.event.startsWith('monster')) return null

    const group = this.group[tile.event]
    if (!group?.length) return null

    // encounterRate를 가중치로 사용
    const totalRate = group.reduce((sum, m) => sum + (m.encounterRate ?? 0), 0)

    // 전부 0이면 출현 없음
    if (totalRate <= 0) return null

    // 1) 출현 여부 결정
    // totalRate가 100 미만이면 일부 확률로 미출현
    if (totalRate < 100) {
      const appearRoll = Math.random() * 100
      if (appearRoll >= totalRate) return null
    }

    // 2) 어떤 몬스터가 나올지 가중치로 선택
    const roll = Math.random() * totalRate

    let acc = 0
    const selected = group.find((m) => {
      acc += m.encounterRate ?? 0
      return roll < acc
    })

    if (!selected) return null

    const baseMonster = this.makeMonster(selected.id)

    if (!baseMonster) {
      return null
    }

    return baseMonster
  }

  makeMonsters(groupName: string): Monster[] {
    const group = this.group[groupName] || []

    return group.map((member) => this.makeMonster(member.id)).filter(Boolean) as Monster[]
  }

  makeMonster(monsterId: string): Monster | void {
    if (!this.monster[monsterId]) {
      return
    }

    const base = _.cloneDeep(this.monster[monsterId])

    return {
      ...base,
      isAlive: true,
      id: generateId(base.id),
    }
  }
}
