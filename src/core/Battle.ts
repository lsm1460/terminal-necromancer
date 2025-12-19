// core/Battle.ts
import { Player } from './Player'
import { Monster } from '../types'

export class Battle {
  static attack(player: Player, monster: Monster): boolean {
    const p = player.computed

    const damage = Math.max(p.atk - monster.def, 1)
    monster.hp -= damage
    console.log(`${monster.name}에게 ${damage} 데미지`)

    if (monster.hp <= 0) return true

    if (Math.random() * 100 < monster.eva) {
      console.log(`${monster.name}의 공격을 회피했다!`)
      return false
    }

    const counter = Math.max(monster.atk - p.def, 1)
    console.log(`${monster.name}의 반격! ${counter} 피해`)
    
    const isDead = player.damage(counter)

    if (!isDead) {
      console.log(`플레이어 남은 HP: ${player.hp}`)
    }

    return false
  }
}
