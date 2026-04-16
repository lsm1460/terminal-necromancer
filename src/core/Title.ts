import i18n from '~/i18n'
import { SaveSystem } from '~/systems/SaveSystem'
import { speak } from '~/utils'
import { Terminal } from './Terminal'
import { ConfigSystem } from '~/systems/ConfigSystem'

export class Title {
  /**
   * CLI와 Web에서 공통으로 사용하는 게임 시작 흐름 제어 로직
   * @param save - 세이브 시스템 인스턴스
   * @param initState - 새 게임 시작 시 사용할 초기 데이터
   */
  static async gameStart(save: SaveSystem, config: ConfigSystem, initState: any): Promise<any> {
    try {
      let _config = config.load()
      let hasSave = save.load()

      const locale = _config?.locale || 'ko'

      await i18n.changeLanguage(locale)

      while (true) {
        const choices = [
          ...(hasSave ? [{ name: 'load', message: i18n.t(`title.load_game`) }] : []),
          { name: 'new', message: i18n.t(`title.new_game_start`) },
          { name: 'config', message: i18n.t(`title.config`) },
          { name: 'exit', message: i18n.t(`title.exit`) },
        ]

        const menu = await Terminal.select(i18n.t(`title.title`), choices)

        if (menu === 'exit') {
          return null
        }

        if (menu === 'load') {
          Terminal.log(`\n${i18n.t('title.load')}\n`)
          return hasSave
        }

        if (menu === 'config') {
          const _res = await Terminal.select(i18n.t(`title.config`), [
            { name: 'locale', message: i18n.t(`title.language`) },
            { name: 'cancel', message: i18n.t(`cancel`) },
          ])

          if (_res === 'cancel') {
            return this.gameStart(save, config, initState)
          }

          if (_res === 'locale') {
            const lang = await Terminal.select<'ko' | 'en'>(
              i18n.t(`title.language`),
              [
                { name: 'ko', message: '한국어' },
                { name: 'en', message: 'ENGLISH' },
              ],
              locale
            )

            await i18n.changeLanguage(lang)
            _config = {
              ...(_config || {}),
              locale: lang,
            }

            config.save(_config)

            return this.gameStart(save, config, initState)
          }
        }

        if (menu === 'new') {
          if (hasSave) {
            const overwrite = await Terminal.confirm(i18n.t('title.save_data_already_exists'))
            if (!overwrite) continue
          }

          // 인트로 시퀀스 진행
          const dialogue = Array.from({ length: 12 }, (_, i) => i18n.t(`title.intro.dialogue_${i}`))
          await speak(dialogue)

          // 초기 데이터로 저장소 갱신
          save.save(initState)
          Terminal.log(`${i18n.t('title.start_game')}\n`)
          return initState
        }
        break
      }
    } catch (e: any) {
      if (e.message === 'EXIT') return null
      throw e
    }
  }
}
