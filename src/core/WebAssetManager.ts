import throttle from 'lodash/throttle'
import { assets, GameAssets } from '~/assets'
import i18n from '~/i18n'
import { useGameStore } from '~/stores/useGameStore'
import { SceneData, UnitSprites } from '~/types'
import { Terminal } from './Terminal'

interface AssetSource {
  id: string
  src: string
}

export class WebAssetManager {
  private images: Map<string, HTMLImageElement> = new Map()
  private audios: Map<string, HTMLAudioElement> = new Map()
  private spriteCache: Map<string, UnitSprites> = new Map()

  private readonly commonManifest = {
    images: [
      { id: 'player_idle_0', src: '/images/player/player_idle_0.png' },
      { id: 'player_idle_1', src: '/images/player/player_idle_1.png' },
      { id: 'player_attack', src: '/images/player/player_attack.png' },
      { id: 'player_hit', src: '/images/player/player_hit.png' },
      { id: 'player_die', src: '/images/player/player_die.png' },
      { id: 'player_escape', src: '/images/player/player_escape.png' },
      // 에셋이 없을 때를 대비한 기본 이미지
      { id: 'default_idle_0', src: '/images/default_idle_0.png' },
      { id: 'default_idle_1', src: '/images/default_idle_1.png' },
      { id: 'default_attack', src: '/images/default_attack.png' },
      { id: 'default_hit', src: '/images/default_hit.png' },
      { id: 'default_die', src: '/images/default_die.png' },
      { id: 'default_escape', src: '/images/default_escape.png' },
    ] as AssetSource[],
    audios: [
      { id: 'sfx_hit', src: '/audio/sfx/hit.wav' },
      { id: 'sfx_die', src: '/audio/sfx/die.wav' },
      { id: 'sfx_escape', src: '/audio/sfx/escape.wav' },
    ] as AssetSource[],
  }

  private async loadWithProgress(imageTasks: AssetSource[], audioTasks: AssetSource[]): Promise<void> {
    const throttledUpdate = throttle((percent: number) => {
      Terminal.update(`[Loading] ${percent}% ...`)
    }, 100)

    const total = imageTasks.length + audioTasks.length
    let loaded = 0

    if (total === 0) return

    const store = useGameStore.getState()

    Terminal.log(`[Loading] ${i18n.t('loading.init')}`)

    store.setIsLoading(true)

    const updateProgress = (id: string) => {
      loaded++
      const percent = Math.floor((loaded / total) * 100)

      if (percent === 100) {
        throttledUpdate.cancel()
        Terminal.update(`[Loading] 100% ...`)
      } else {
        throttledUpdate(percent)
      }
    }

    const imagePromises = imageTasks.map(async (img) => {
      await this.loadImage(img.id, img.src)
      updateProgress(img.id)
    })

    const audioPromises = audioTasks.map(async (aud) => {
      await this.loadAudio(aud.id, aud.src)
      updateProgress(aud.id)
    })

    await Promise.allSettled([...imagePromises, ...audioPromises])

    store.setIsLoading(false)
  }

  public async loadInitialAssets(assets: GameAssets, locale: 'ko' | 'en'): Promise<void> {
    Terminal.log(`\x1b[36m[System] ${i18n.t('loading.resource')}\x1b[0m`)
    await this.loadWithProgress(this.commonManifest.images, this.commonManifest.audios)
    Terminal.log(`\x1b[32m[System] ${i18n.t('loading.success')}\x1b[0m\n`)
  }

  public async loadSceneAssets(sceneData: SceneData): Promise<void> {
    if (typeof window === 'undefined') return
    if (!sceneData) return

    this.clearMonsterAssets()
    this.spriteCache.clear()

    const resourceIds = new Set<string>()

    sceneData.tiles.flat().forEach((tile) => {
      if (!tile) return
      tile.npcIds?.forEach((id) => resourceIds.add(id))
      if (tile.event) {
        const group = (assets.monsterGroup as any)[tile.event]
        if (group) group.forEach((m: any) => resourceIds.add(m.id))
      }
    })

    const manifest = this.buildUnitManifest(Array.from(resourceIds))

    Terminal.log(`\n\x1b[34m[System] '${sceneData.displayName}' 리소스 로드 중...\x1b[0m`)
    // 장면 로딩은 이미지만 있으므로 오디오는 빈 배열 전달
    await this.loadWithProgress(manifest, [])
    Terminal.log('\x1b[32m[System] 장면 전환 완료.\x1b[0m')
  }

  public getSprites(originId: string): UnitSprites | void {
    if (typeof window === 'undefined') return

    if (this.spriteCache.has(originId)) {
      return this.spriteCache.get(originId)!
    }

    const getWithFallback = (suffix: string) => {
      return this.images.get(`${originId}${suffix}`) || this.images.get(`default${suffix}`) || null
    }

    const states = ['attack', 'hit', 'die', 'escape'] as const
    const sprites = {
      idle: [getWithFallback('_idle_0'), getWithFallback('_idle_1')].filter(Boolean),
    } as any

    states.forEach((state) => {
      sprites[state] = getWithFallback(`_${state}`)
    })

    this.spriteCache.set(originId, sprites)

    return sprites as UnitSprites
  }

  public playSound(id: string, volume: number = 0.5): void {
    const audio = this.audios.get(id)
    if (audio) {
      const sound = audio.cloneNode() as HTMLAudioElement
      sound.volume = volume
      sound.play().catch(() => {}) // 브라우저 정책 방어
    }
  }

  // --- 내부 지원 메서드 ---
  private buildUnitManifest(originIds: string[]): AssetSource[] {
    const manifest: AssetSource[] = []
    originIds.forEach((id) => {
      ;['idle_0', 'idle_1', 'attack', 'hit', 'die', 'escape'].forEach((state) => {
        manifest.push({ id: `${id}_${state}`, src: `/images/${id}/${id}_${state}.png` })
      })
    })
    return manifest
  }

  private async loadImage(id: string, src: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.images.has(id)) return resolve()
      const img = new Image()
      img.src = src
      img.onload = () => {
        this.images.set(id, img)
        resolve()
      }
      img.onerror = () => {
        resolve()
      }
    })
  }

  private async loadAudio(id: string, src: string): Promise<void> {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.src = src
      audio.oncanplaythrough = () => {
        this.audios.set(id, audio)
        resolve()
      }
      audio.onerror = () => {
        resolve()
      }
    })
  }

  private clearMonsterAssets(): void {
    const preserveIds = ['player', 'default', 'skeleton', 'golem', 'knight']

    const pattern = preserveIds.map((id) => `${id}_`).join('|')
    const preserveRegex = new RegExp(`^(${pattern})`)

    for (const key of this.images.keys()) {
      if (!preserveRegex.test(key)) {
        this.images.delete(key)
      }
    }
  }
}

export const assetManager = new WebAssetManager()
