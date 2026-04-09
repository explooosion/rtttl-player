import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";
import zhHK from "./locales/zh-HK.json";
import zhCN from "./locales/zh-CN.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      "zh-TW": { translation: zhTW },
      "zh-HK": { translation: zhHK },
      "zh-CN": { translation: zhCN },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
