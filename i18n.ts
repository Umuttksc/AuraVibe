import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Language metadata with display information
export const SUPPORTED_LANGUAGES_OBJECT = {
  tr: {
    code: "tr",
    emoji: "🇹🇷",
    name: "Turkish",
    nativeName: "Türkçe",
    dir: "ltr",
  },
  en: {
    code: "en",
    emoji: "🇺🇸",
    name: "English",
    nativeName: "English",
    dir: "ltr",
  },
  zh: {
    code: "zh",
    emoji: "🇨🇳",
    name: "Chinese",
    nativeName: "中文",
    dir: "ltr",
  },
  hi: {
    code: "hi",
    emoji: "🇮🇳",
    name: "Hindi",
    nativeName: "हिन्दी",
    dir: "ltr",
  },
  es: {
    code: "es",
    emoji: "🇪🇸",
    name: "Spanish",
    nativeName: "Español",
    dir: "ltr",
  },
  fr: {
    code: "fr",
    emoji: "🇫🇷",
    name: "French",
    nativeName: "Français",
    dir: "ltr",
  },
  ar: {
    code: "ar",
    emoji: "🇸🇦",
    name: "Arabic",
    nativeName: "العربية",
    dir: "rtl",
  },
  bn: {
    code: "bn",
    emoji: "🇧🇩",
    name: "Bengali",
    nativeName: "বাংলা",
    dir: "ltr",
  },
  ru: {
    code: "ru",
    emoji: "🇷🇺",
    name: "Russian",
    nativeName: "Русский",
    dir: "ltr",
  },
  pt: {
    code: "pt",
    emoji: "🇵🇹",
    name: "Portuguese",
    nativeName: "Português",
    dir: "ltr",
  },
  id: {
    code: "id",
    emoji: "🇮🇩",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    dir: "ltr",
  },
} as const;

// Define default language
export const DEFAULT_LANGUAGE: keyof typeof SUPPORTED_LANGUAGES_OBJECT = "tr";

// Derive constants from metadata (single source of truth)
export const SUPPORTED_LANGUAGES_ARRAY = Object.keys(
  SUPPORTED_LANGUAGES_OBJECT,
) as Array<keyof typeof SUPPORTED_LANGUAGES_OBJECT>;
export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES_OBJECT;

// Check if a language code is supported
export function isSupportedLanguage(
  lang: string | undefined,
): lang is SupportedLanguage {
  return (
    !!lang && SUPPORTED_LANGUAGES_ARRAY.includes(lang as SupportedLanguage)
  );
}

// Saved language from localStorage (computed once at module load)
export const SAVED_LANGUAGE =
  typeof window !== "undefined"
    ? (() => {
        try {
          const stored = localStorage.getItem("language");
          return stored && isSupportedLanguage(stored) ? stored : null;
        } catch {
          // localStorage might be disabled (private browsing, etc.)
          return null;
        }
      })()
    : null;

// Saved language or default language
export const SAVED_OR_DEFAULT_LANGUAGE: SupportedLanguage =
  SAVED_LANGUAGE ?? DEFAULT_LANGUAGE;

// Set language in path - handles all language routing logic
export function setLanguageInPath(
  language: string,
  pathname: string,
  search: string = "",
  hash: string = "",
): string {
  // Use saved/default language if provided language is invalid
  const targetLanguage = isSupportedLanguage(language)
    ? language
    : SAVED_OR_DEFAULT_LANGUAGE;

  // Handle root path
  if (pathname === "/") {
    return `/${targetLanguage}${search}${hash}`;
  }

  // Split pathname into segments
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  const firstSegmentLowercase = firstSegment?.toLowerCase();

  // If first segment is a valid language (case-insensitive), replace it
  if (firstSegmentLowercase && isSupportedLanguage(firstSegmentLowercase)) {
    segments[0] = targetLanguage;
    return `/${segments.join("/")}${search}${hash}`;
  }

  // Otherwise, prepend the language
  return `/${targetLanguage}${pathname}${search}${hash}`;
}

// Utility function to change language and update document attributes
export async function changeLanguage(lng: SupportedLanguage) {
  try {
    await i18n.changeLanguage(lng);
    const languageMetadata = SUPPORTED_LANGUAGES_OBJECT[lng];
    document.documentElement.lang = lng;
    document.documentElement.dir = languageMetadata.dir ?? "ltr";

    try {
      localStorage.setItem("language", lng);
    } catch {
      // localStorage might be disabled - fail silently
    }
  } catch (error) {
    console.error("Failed to change language:", error);
    throw error;
  }
}

// Eagerly import all translation files - bundled at build time for instant access
// Using { eager: true } loads all files synchronously in a single bundle
// Translation files must be flat key-value pairs: { "key": "value", "nav.home": "Home" }
const translationModules = import.meta.glob<{
  default: Record<string, string>;
}>("./locales/*/*.json", { eager: true });

// Build resources object for i18next from imported modules
const resources: Record<string, Record<string, Record<string, string>>> = {};

for (const [path, module] of Object.entries(translationModules)) {
  // Extract language and namespace from path: ./locales/en/common.json -> en, common
  const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (match) {
    const [, lng, ns] = match;
    if (!resources[lng]) {
      resources[lng] = {};
    }
    resources[lng][ns] = module.default;
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: SAVED_OR_DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES_ARRAY,
  defaultNS: "common",
  react: { useSuspense: true },
});

export default i18n;
