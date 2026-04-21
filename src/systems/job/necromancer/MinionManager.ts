import { Terminal } from '~/core/Terminal'
import { GameAmor } from '~/systems/item/GameAmor'
import { GameWeapon } from '~/systems/item/GameWeapon'
import { BattleTarget } from '~/types'
import { ItemRarity } from '~/types/item'
import GolemWrapper from './GolemWrapper'
import KnightWrapper from './KnightWrapper'
import { Necromancer, NecromancerSaveData } from './Necromancer'
import SkeletonWrapper from './SkeletonWrapper'

export class MinionManager {
  skeletonSubspace: BattleTarget[] = []
  subspaceLimit = 15

  private _skeleton: BattleTarget[] = [] // 현재 거느리고 있는 소환수들
  _maxSkeleton: number = 2 // 최대 소환 가능 수

  private _mercenary: BattleTarget[] = []
  maxMercenary = 3

  upgradeLimit = 5
  golemUpgrade: ('machine' | 'soul')[] = []
  private _golem: BattleTarget | undefined = undefined
  knightUpgrade: ItemRarity[] = []
  private _knight: BattleTarget | undefined = undefined

  constructor(
    private player: Necromancer,
    saved?: NecromancerSaveData
  ) {
    if (saved) {
      if (saved.skeletonSubspace) this.skeletonSubspace = saved.skeletonSubspace
      if (saved.subspaceLimit) this.subspaceLimit = saved.subspaceLimit
      if (saved._skeleton) this._skeleton = saved._skeleton
      if (saved._maxSkeleton) this._maxSkeleton = saved._maxSkeleton
      if (saved.golemUpgrade) this.golemUpgrade = saved.golemUpgrade
      if (saved._golem) this._golem = saved._golem
      if (saved.knightUpgrade) this.knightUpgrade = saved.knightUpgrade
      if (saved._knight) this._knight = saved._knight
    }
  }

  get maxSkeleton() {
    let maxSkeleton = this._maxSkeleton

    if (this.player.equipped.weapon) maxSkeleton += (this.player.equipped.weapon as GameWeapon)?.maxSkeleton || 0
    if (this.player.equipped.armor) maxSkeleton += (this.player.equipped.armor as GameAmor)?.maxSkeleton || 0

    const _val = this.player.getAffixValue('OVERLORD')

    return maxSkeleton + _val
  }

  get skeleton() {
    return this._skeleton.map((sk) => new SkeletonWrapper(sk, this.player))
  }

  set skeleton(_minions) {
    this._skeleton = _minions
  }

  get golem() {
    if (!this._golem) {
      return
    }

    return new GolemWrapper(this._golem, this.golemUpgrade, this.player)
  }

  get knight() {
    if (!this._knight) {
      return
    }

    return new KnightWrapper(this._knight, this.knightUpgrade, this.player)
  }

  get minions(): BattleTarget[] {
    const _skeletons = this.skeleton.sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0))

    return [this.golem!, ..._skeletons, this.knight!, ...this._mercenary].filter((_minion) => !!_minion)
  }

  public updateSkeletonLimit() {
    const currentMax = this.maxSkeleton // [군주] 어픽스가 계산된 최신 Max값

    // 현재 해골 수가 줄어든 최대치보다 많다면?
    while (this.skeleton.length > currentMax) {
      // 1. 가장 마지막에 추가된(최근 소환된) 해골을 제거
      const removedSkeleton = this.skeleton.pop()

      if (removedSkeleton) {
        Terminal.log(` └ ⚠️ 장비가 해제되어 ${removedSkeleton.name}이(가) 소멸했습니다.`)
        this.removeMinion(removedSkeleton.id)
      }
    }
  }

  addSkeleton(minion: BattleTarget) {
    if (this.skeleton.length < this.maxSkeleton) {
      this._skeleton.push(minion)
      return true
    }

    return false
  }

  addMercenary(mercenary: BattleTarget) {
    if (this._mercenary.length < this.maxMercenary) {
      this._mercenary.push(mercenary)
      return true
    }

    return false
  }

  removeMercenaries() {
    this._mercenary = []
  }

  removeMinion(minionId: string) {
    this._skeleton = this._skeleton.filter((_minion) => _minion.id !== minionId)

    if (this._golem && this._golem.id === minionId) {
      this._golem = {
        ...this._golem,
        isAlive: false,
      }
    }

    if (this._knight && this._knight.id === minionId) {
      this._knight = {
        ...this._knight,
        isAlive: false,
      }
    }
  }

  unlockGolem(type: 'zed' | 'maya') {
    if (this._golem) {
      return
    }

    const configs = {
      zed: {
        hp: 80,
        atk: 30,
        def: 20,
      },
      maya: {
        hp: 90,
        atk: 20,
        def: 40,
      },
    }

    const config = configs[type]

    this._golem = {
      id: 'golem',
      name: '',
      attackType: 'melee',
      baseMaxHp: config.hp,
      maxHp: config.hp,
      hp: config.hp,
      baseAtk: config.atk,
      atk: config.atk,
      baseDef: config.def,
      def: config.def,
      agi: 3,
      exp: 0,
      description: '',
      dropTableId: '',
      encounterRate: 0,
      isAlive: true,
      skills: ['power_smash'],
      isMinion: true,
      isGolem: true,
      deathLine: '',
      orderWeight: -15,
      madeBy: type,
    }
  }

  unlockKnight(skeleton: SkeletonWrapper) {
    this.knightUpgrade = []

    this._knight = {
      id: '_knight',
      name: '',
      attackType: 'melee',
      hp: skeleton.maxHp,
      baseMaxHp: skeleton.maxHp,
      maxHp: skeleton.maxHp,
      baseAtk: skeleton.atk,
      atk: skeleton.atk,
      baseDef: skeleton.def,
      def: skeleton.def,
      eva: skeleton.eva,
      exp: 0,
      agi: skeleton.agi,
      encounterRate: 0,
      isAlive: true,
      isMinion: true,
      isKnight: true,
      deathLine: '',
      description: '',
      dropTableId: '',
      originId: skeleton.originId,
      skills: ['power_smash'],
    }
  }

  public toJSON() {
    return {
      _skeleton: this._skeleton,
      _mercenary: this._mercenary,
      skeletonSubspace: this.skeletonSubspace,
      subspaceLimit: this.subspaceLimit,
      _maxSkeleton: this._maxSkeleton,
      _golem: this._golem,
      _knight: this._knight,
      golemUpgrade: this.golemUpgrade,
      knightUpgrade: this.knightUpgrade,
      upgradeLimit: this.upgradeLimit,
    }
  }
}
