import { debounce } from 'lodash'

export interface SoundProvider {
  getAudioSource(id: string): HTMLAudioElement | void
}

export class SoundManager {
  private static instance: SoundManager | null = null

  private _volume: number = 0.5
  private _isMute: boolean = false
  private currentBgm: HTMLAudioElement | null = null
  private activeEffects: Map<string, HTMLAudioElement> = new Map()

  private debouncedPlayCache: Map<string, ReturnType<typeof debounce>> = new Map()

  private constructor(private provider: SoundProvider) {}

  public static init(provider: SoundProvider): void {
    if (!this.instance) {
      this.instance = new SoundManager(provider)
    }
  }

  public static getInstance(): SoundManager {
    if (!this.instance) {
      throw new Error('SoundManager가 초기화되지 않았습니다. init(provider)를 먼저 호출하세요.')
    }
    return this.instance
  }

  /**
   * 실제 계산된 볼륨 (음소거 시 0, 아니면 설정된 볼륨)
   */
  private get effectiveVolume(): number {
    return this._isMute ? 0 : this._volume
  }

  public get volume(): number {
    return this._volume
  }

  public get isMute(): boolean {
    return this._isMute
  }

  public setVolume(value: number): void {
    this._volume = Math.max(0, Math.min(1, value))
    this.syncLiveAudioVolume()
  }

  public setMute(mute: boolean): void {
    this._isMute = mute
    this.syncLiveAudioVolume()
  }

  private syncLiveAudioVolume(): void {
    const vol = this.effectiveVolume

    // BGM 반영
    if (this.currentBgm) {
      this.currentBgm.volume = vol
    }

    // 재생 중인 모든 효과음 반영 (실시간 볼륨 조절 대응)
    this.activeEffects.forEach((effect) => {
      effect.volume = vol
    })
  }

  public playBgm(id: string): void {
    const source = this.provider.getAudioSource(id)
    if (!source) return

    if (this.currentBgm && this.currentBgm.dataset.id === id) return

    this.stopBgm()

    const bgm = source.cloneNode() as HTMLAudioElement
    bgm.dataset.id = id
    bgm.loop = true
    bgm.volume = this.effectiveVolume // 계산된 볼륨 적용

    bgm.play().catch(() => console.warn('BGM 재생 실패: 사용자 상호작용 필요'))
    this.currentBgm = bgm
  }

  public stopBgm(): void {
    if (this.currentBgm) {
      this.currentBgm.pause()
      this.currentBgm = null
    }
  }

  public playEffect(id: string): void {
    let debouncedPlay = this.debouncedPlayCache.get(id)

    if (!debouncedPlay) {
      debouncedPlay = debounce(() => {
        this.executePlayEffect(id)
      }, 50)

      this.debouncedPlayCache.set(id, debouncedPlay)
    }

    debouncedPlay()
  }

  private executePlayEffect(id: string): void {
    const source = this.provider.getAudioSource(id)
    if (!source) return

    this.stopEffect(id)

    const effect = source.cloneNode() as HTMLAudioElement
    effect.volume = this.effectiveVolume // 계산된 볼륨 적용

    effect.onended = () => this.activeEffects.delete(id)
    effect.play().catch(() => {})

    this.activeEffects.set(id, effect)
  }

  public stopEffect(id: string): void {
    const existing = this.activeEffects.get(id)
    if (existing) {
      existing.pause()
      existing.currentTime = 0
      this.activeEffects.delete(id)
    }
  }
}