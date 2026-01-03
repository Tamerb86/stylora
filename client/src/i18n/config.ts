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

// Check if user has previously selected a language
let savedLanguage: string | null = null;
try {
  savedLanguage = localStorage.getItem("i18nextLng");
} catch (e) {
  // localStorage might be unavailable in some contexts (SSR, etc.)
  console.warn("Failed to access localStorage:", e);
}

// Only use saved language if it's one of our supported languages
const supportedLanguages = ["no", "ar", "en", "uk"];
const initialLanguage =
  savedLanguage && supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : "no"; // Default to Norwegian

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage, // Use saved language or Norwegian as default
  fallbackLng: "no",
  debug: false,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

// Save language preference when it changes
i18n.on("languageChanged", lng => {
  try {
    localStorage.setItem("i18nextLng", lng);
  } catch (e) {
    // localStorage might be unavailable in some contexts
    console.warn("Failed to save language preference:", e);
  }
});

export default i18n;
