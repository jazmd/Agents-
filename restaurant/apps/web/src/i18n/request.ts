import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, messages as allMessages, type AppLocale } from '@bykebap/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (locales as readonly string[]).includes(requested ?? '')
    ? (requested as AppLocale)
    : undefined;

  if (!locale) notFound();

  return { locale, messages: allMessages[locale] };
});
