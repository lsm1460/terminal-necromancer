import throttle from 'lodash/throttle'
import { assets } from '~/assets'
import { loadExtraLocaleBundle } from '~/assets/locales'
import i18n from '~/i18n'
import { useGameStore } from '~/stores/useGameStore'
import { delay } from '~/utils'
import { Terminal } from './Terminal'
import { SceneData, UnitSprites } from './types'

export interface AssetSource {
  id: string
  src: string
}

export interface AssetManifest {
  images: AssetSource[]
  audios: AssetSource[]
}

export class WebAssetManager {
  private images: Map<string, HTMLImageElement> = new Map()
  private audios: Map<string, HTMLAudioElement> = new Map()
  private spriteCache: Map<string, UnitSprites> = new Map()

  private readonly commonManifest: AssetManifest

  constructor(commonManifest: AssetManifest) {
    this.commonManifest = commonManifest
  }

  private async loadWithProgress(imageTasks: AssetSource[], audioTasks: AssetSource[]): Promise<void> {
    const total = imageTasks.length + audioTasks.length
    let loaded = 0

    if (total === 0) return

    const store = useGameStore.getState()

    Terminal.log(`[Loading] ${i18n.t('loading.init')}`)

    store.setIsLoading(true)

    const throttledUIUpdate = throttle((percent: number) => {
      Terminal.update(`[Loading] ${percent}% ...`)
    }, 100)

    const updateProgress = () => {
      loaded++
      const percent = Math.floor((loaded / total) * 100)

      throttledUIUpdate(percent)

      if (loaded === total) {
        throttledUIUpdate.flush()
      }
    }

    const imagePromises = imageTasks.map(async (img) => {
      await this.loadImage(img.id, img.src)
      updateProgress()
    })

    const audioPromises = audioTasks.map(async (aud) => {
      await this.loadAudio(aud.id, aud.src)
      updateProgress()
    })

    await Promise.allSettled([...imagePromises, ...audioPromises])

    store.setIsLoading(false)
  }

  public async loadInitialAssets(sceneData: SceneData, locale: 'ko' | 'en'): Promise<void> {
    Terminal.log(`\x1b[36m[System] ${i18n.t('loading.resource')}\x1b[0m`)
    await loadExtraLocaleBundle(locale)

    const assetSources = this.getSceneAssetSources(sceneData)
    await this.loadWithProgress([...this.commonManifest.images, ...assetSources], this.commonManifest.audios)

    await delay(500)

    Terminal.log(`\x1b[32m[System] ${i18n.t('loading.success')}\x1b[0m\n`)
  }

  private getSceneAssetSources(sceneData: SceneData): AssetSource[] {
    if (!sceneData) return []

    const resourceIds = new Set<string>()

    sceneData.tiles.flat().forEach((tile) => {
      if (!tile) return

      // NPC 리소스 ID 수집
      tile.npcIds?.forEach((id) => resourceIds.add(id))

      // 이벤트(몬스터 그룹) 리소스 ID 수집
      if (tile.event) {
        const group = (assets.monsterGroup as any)[tile.event]
        if (group) {
          group.forEach((m: any) => resourceIds.add(m.id))
        }
      }

      if (tile.assets) {
        tile.assets.forEach((id: string) => resourceIds.add(id))
      }
    })

    const sources = this.buildUnitManifest(Array.from(resourceIds))

    sources.push({ id: sceneData.id, src: `/images/scene/${sceneData.id}.png` })

    return sources
  }

  public async loadSceneAssets(sceneData: SceneData): Promise<void> {
    if (typeof window === 'undefined') return
    if (!sceneData) return

    this.clearMonsterAssets()
    this.spriteCache.clear()

    const assetSources = this.getSceneAssetSources(sceneData)

    const sceneName = i18n.t(`scene.${sceneData.id}`)

    Terminal.log(`\n\x1b[36m[System] ${i18n.t('loading.scene.start', { name: sceneName })}\x1b[0m`)

    await this.loadWithProgress(assetSources, [])

    Terminal.log(`\x1b[32m[System] ${i18n.t('loading.scene.complete')}\x1b[0m`)
  }

  public getSprites(originId: string): UnitSprites | void {
    if (typeof window === 'undefined') return

    if (this.spriteCache.has(originId)) {
      return this.spriteCache.get(originId)!
    }

    let isFallbackUsed = false

    const getWithFallback = (suffix: string) => {
      const original = this.images.get(`${originId}${suffix}`)
      if (original) return original

      const fallback = this.images.get(`default${suffix}`)
      if (fallback) {
        isFallbackUsed = true
        return fallback
      }

      return null
    }

    const states = ['attack'] as const

    const sprites: any = {
      idle: [getWithFallback('_idle_0'), getWithFallback('_idle_1')].filter(Boolean),
      isFallback: false, // 초기값
    }

    states.forEach((state) => {
      sprites[state] = getWithFallback(`_${state}`)
    })

    sprites.isFallback = isFallbackUsed

    this.spriteCache.set(originId, sprites)

    return sprites as UnitSprites
  }

  public getAudioSource(id: string): HTMLAudioElement | void {
    return this.audios.get(id)
  }

  private buildUnitManifest(originIds: string[]): AssetSource[] {
    const manifest: AssetSource[] = []
    originIds.forEach((id) =>
      ['idle_0', 'idle_1', 'attack'].forEach((state) => {
        manifest.push({ id: `${id}_${state}`, src: `/images/${id}/${id}_${state}.png` })
      })
    )
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
    const protectedIds = new Set(this.commonManifest.images.map((img) => img.id))

    for (const key of this.images.keys()) {
      if (!protectedIds.has(key)) {
        this.images.delete(key)
      }
    }
  }
}
