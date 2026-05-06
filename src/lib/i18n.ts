import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ro from '../locales/ro.json'
import en from '../locales/en.json'
import ja from '../locales/ja.json'

i18n.use(initReactI18next).init({
  lng: 'ro',
  fallbackLng: 'ro',
  supportedLngs: ['ro', 'en', 'ja'],
  resources: {
    ro: { translation: ro },
    en: { translation: en },
    ja: { translation: ja },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
