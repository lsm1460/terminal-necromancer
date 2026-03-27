import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { initialResources } from './assets/locales'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: initialResources, // 초기화 시점에는 가벼운 데이터만 사용
    lng: 'ko',
    fallbackLng: 'ko',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n