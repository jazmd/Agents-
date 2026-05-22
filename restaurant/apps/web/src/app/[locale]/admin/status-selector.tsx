'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { updateOrderStatus } from '@/lib/actions/orders';

type Status = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

const STATUSES: Status[] = ['PENDING', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

const COLOR: Record<Status, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PREPARING: 'bg-blue-100 text-blue-800 border-blue-200',
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DELIVERING: 'bg-violet-100 text-violet-800 border-violet-200',
  COMPLETED: 'bg-charcoal-100 text-charcoal-700 border-charcoal-200',
  CANCELLED: 'bg-brand-100 text-brand-700 border-brand-200',
};

export function StatusSelector({
  orderId,
  status,
  labels,
}: {
  orderId: string;
  status: Status;
  labels: Record<Status, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Status;
    startTransition(async () => {
      await updateOrderStatus(orderId, next);
      router.refresh();
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${COLOR[status]} disabled:opacity-60`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </select>
  );
}
