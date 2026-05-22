import de from './messages/de.json';
import en from './messages/en.json';
import tr from './messages/tr.json';
import ru from './messages/ru.json';

export const locales = ['de', 'en', 'tr', 'ru'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'de';

export const messages = { de, en, tr, ru } as const;

export const localeLabels: Record<AppLocale, string> = {
  de: 'Deutsch',
  en: 'English',
  tr: 'Türkçe',
  ru: 'Русский',
};

export const localeFlags: Record<AppLocale, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  tr: '🇹🇷',
  ru: '🇷🇺',
};
