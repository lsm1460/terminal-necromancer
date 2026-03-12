import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './assets/locales/en/init.json'
import ko from './assets/locales/ko/init.json'
// tile
import enTile from './assets/locales/en/tile-dialogue.json'
import koTile from './assets/locales/ko/tile-dialogue.json'
// item
import enItem from './assets/locales/en/item.json'
import koItem from './assets/locales/ko/item.json'
// affix
import enAffix from './assets/locales/en/affix.json'
import koAffix from './assets/locales/ko/affix.json'
// in web
import enWeb from './assets/locales/en/web.json'
import koWeb from './assets/locales/ko/web.json'
// broadcast
import enBroadcast from './assets/locales/en/broadcast.json'
import koBroadcast from './assets/locales/ko/broadcast.json'
// npc
import enNpc from './assets/locales/en/npc.json'
import koNpc from './assets/locales/ko/npc.json'
//monster
import enMonster from './assets/locales/en/monster.json'
import koMonster from './assets/locales/ko/monster.json'

const resources = {
  ko: {
    translation: {
      ...ko,
      tile: koTile,
      item: koItem,
      affix: koAffix,
      web: koWeb,
      broadcast: koBroadcast,
      npc: {
        ...koNpc,
        ...koMonster,
      },
    },
  },
  en: {
    translation: {
      ...en,
      tile: enTile,
      item: enItem,
      affix: enAffix,
      web: enWeb,
      broadcast: enBroadcast,
      npc: {
        ...enNpc,
        ...enMonster,
      },
    },
  },
}

i18n
  .use(LanguageDetector) // 브라우저 언어 자동 감지
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko', // 기본 언어 설정
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false, // React는 이미 XSS 방지를 하므로 false
    },
  })

export default i18n
