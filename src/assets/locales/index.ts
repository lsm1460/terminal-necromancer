import i18n from 'i18next';

// 초기 로딩에 "반드시" 필요한 최소한의 데이터만 정적으로 임포트
import koInit from './ko/init.json';
import koMap from './ko/map.json';
import koWeb from './ko/web.json';

import enInit from './en/init.json';
import enMap from './en/map.json';
import enWeb from './en/web.json';

// 1. 초기 리소스 설정
export const initialResources = {
  ko: {
    translation: { ...koInit, ...koMap, web: koWeb },
  },
  en: {
    translation: { ...enInit, ...enMap, web: enWeb },
  },
};

export const loadExtraLocaleBundle = async (lang: 'ko' | 'en') => {
  const bundle = await import(`./${lang}/index.ts`);
  
  i18n.addResourceBundle(lang, 'translation', bundle.default, true, true);
};