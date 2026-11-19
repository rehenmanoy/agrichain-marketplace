import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ml from './ml.json'

const STORAGE_KEY = 'agrichain_lang'

function savedLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ml' ? 'ml' : 'en'
  } catch {
    return 'en'
  }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ml: { translation: ml } },
  lng: savedLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // storage blocked: the choice just won't be remembered
  }
})

export default i18n
