import { setRequestLocale } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import { CheckoutForm } from './checkout-form';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  return (
    <CheckoutForm
      defaultName={user?.name ?? ''}
      defaultEmail={user?.email ?? ''}
      defaultPhone={user?.phone ?? ''}
    />
  );
}
