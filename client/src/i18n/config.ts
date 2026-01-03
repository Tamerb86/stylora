import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import translationNO from "./locales/no.json";
import translationAR from "./locales/ar.json";
import translationEN from "./locales/en.json";
import translationUK from "./locales/uk.json";

const resources = {
  no: {
    translation: translationNO,
  },
  ar: {
    translation: translationAR,
  },
  en: {
    translation: translationEN,
  },
  uk: {
    translation: translationUK,
  },
};

// Supported languages
const supportedLanguages = ["no", "ar", "en", "uk"];

// Function to normalize language codes (e.g., en-US -> en)
function normalizeLanguage(lang: string): string {
  if (!lang) return "no";
  const normalized = lang.toLowerCase().split("-")[0];
  return supportedLanguages.includes(normalized) ? normalized : "no";
}

// Check if user has previously selected a language
let savedLanguage: string | null = null;
try {
  savedLanguage = localStorage.getItem("i18nextLng");
} catch (e) {
  // localStorage might be unavailable in some contexts (SSR, etc.)
  console.warn("Failed to access localStorage:", e);
}

// Normalize and validate saved language
const initialLanguage = savedLanguage 
  ? normalizeLanguage(savedLanguage)
  : "no"; // Default to Norwegian

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage, // Use saved language or Norwegian as default
  fallbackLng: "no",
  supportedLngs: supportedLanguages,
  debug: false,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  // Disable automatic language detection from browser
  detection: {
    order: ['localStorage'],
    caches: ['localStorage'],
  },
});

// Save language preference when it changes
i18n.on("languageChanged", lng => {
  try {
    // Normalize and save language preference
    const normalized = normalizeLanguage(lng);
    localStorage.setItem("i18nextLng", normalized);
    
    // Set document direction and lang attribute for RTL support
    document.documentElement.dir = normalized === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = normalized;
  } catch (e) {
    // localStorage might be unavailable in some contexts
    console.warn("Failed to save language preference:", e);
  }
});

export default i18n;
