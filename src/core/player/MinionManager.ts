import { BattleTarget } from '~/types'
import { ItemRarity } from '../item/consts'
import { Terminal } from '../Terminal'
import GolemWrapper from './GolemWrapper'
import KnightWrapper from './KnightWrapper'
import { Player, PlayerSaveData } from './Player'
import SkeletonWrapper from './SkeletonWrapper'

export class MinionManager {
  skeletonSubspace: BattleTarget[] = []
  subspaceLimit = 15
  private _skeleton: BattleTarget[] = [] // 현재 거느리고 있는 소환수들
  _maxSkeleton: number = 2 // 최대 소환 가능 수

  upgradeLimit = 5
  golemUpgrade: ('machine' | 'soul')[] = []
  private _golem: BattleTarget | undefined = undefined
  knightUpgrade: (ItemRarity | 'soul')[] = []
  private _knight: BattleTarget | undefined = undefined

  constructor(
    private player: Player,
    saved?: PlayerSaveData
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

    if (this.player.equipped.weapon) maxSkeleton += this.player.equipped.weapon?.maxSkeleton || 0
    if (this.player.equipped.armor) maxSkeleton += this.player.equipped.armor?.maxSkeleton || 0

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

    return new KnightWrapper(this._knight, this.player)
  }

  get minions(): BattleTarget[] {
    const _skeletons = this.skeleton.sort((a, b) => (a?.orderWeight || 0) - (b?.orderWeight || 0))

    return [this.golem!, ..._skeletons, this.knight!].filter((_minion) => !!_minion)
  }

  public updateSkeletonLimit() {
    const currentMax = this.maxSkeleton // [군주] 어픽스가 계산된 최신 Max값

    // 현재 해골 수가 줄어든 최대치보다 많다면?
    while (this.skeleton.length > currentMax) {
      // 1. 가장 마지막에 추가된(최근 소환된) 해골을 제거
      const removedSkeleton = this.skeleton.pop()

      if (removedSkeleton) {
        Terminal.log(` └ ⚠️ 장비가 해제되어 ${removedSkeleton.name}이(가) 소멸했습니다.`)
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

  removeMinion(minionId: string) {
    this.skeleton = this.skeleton.filter((_minion) => _minion.id !== minionId)

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
        description:
          '하역장에서 수거한 핵으로 제드가 부활시킨 거대 병기입니다.\n사신의 마력이 깃들어 금속 틈새로 검은 안개가 뿜어져 나옵니다.',
      },
      maya: {
        hp: 90,
        atk: 20,
        def: 40,
        description: '하역장에서 수거한 핵으로 마야가 부활시킨 거대 병기입니다.',
      },
    }

    const config = configs[type]

    this._golem = {
      id: 'golem',
      name: '하역장의 기계 골렘',
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
      description: config.description,
      dropTableId: '',
      encounterRate: 0,
      isAlive: true,
      skills: ['power_smash'],
      isMinion: true,
      isGolem: true,
      deathLine: '(알 수 없는 기계음)',
      orderWeight: -15,
    }
  }

  unlockKnight() {
    if (this._knight) {
      return
    }

    this._knight = {
      id: 'knight',
      name: '기사 발타자르',
      attackType: 'melee',
      hp: 10,
      baseMaxHp: 10,
      maxHp: 10,
      baseAtk: 12,
      atk: 12,
      baseDef: 12,
      def: 5,
      eva: 0.15,
      exp: 0,
      agi: 5,
      encounterRate: 0,
      isAlive: true,
      isMinion: true,
      isKnight: true,
      deathLine: '발타자르: "아직은... 쉴 수 없는데... (발타자르의 안광이 흐릿해지며 갑옷이 무너져 내립니다.)"',
      description:
        '성역의 시종장이라는 굴레를 벗어던지고 다시 당신의 기사가 된 자. 이전보다 더욱 짙은 죽음의 기운을 뿜어냅니다.',
      dropTableId: '',
      skills: ['power_smash'],
    }

    Terminal.log('[영혼이 귀속된 발타자르]를 획득했다.')
  }

  public toJSON() {
    return {
      _skeleton: this._skeleton,
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
