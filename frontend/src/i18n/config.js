import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: {
        translation: {
          visualization: '可视化',
          regression: '回归分析',
          classification: '分类分析',
          dataPreview: '数据预览',
          appName: 'VisionaryLens'
        }
      },
      ja: {
        translation: {
          visualization: '可視化',
          regression: '回帰分析',
          classification: '分類分析',
          dataPreview: 'データプレビュー',
          appName: 'VisionaryLens'
        }
      },
      en: {
        translation: {
          visualization: 'Visualization',
          regression: 'Regression Analysis',
          classification: 'Classification Analysis',
          dataPreview: 'Data Preview',
          appName: 'VisionaryLens'
        }
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 