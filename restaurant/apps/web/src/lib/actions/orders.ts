'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '../db';
import { getSession } from '../auth';
import { generatePublicId } from '../format';
import { deliveryFor } from '../cart-store';
import { getProduct } from '@bykebap/menu';

const CartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(50),
});

const CheckoutSchema = z.object({
  method: z.enum(['DELIVERY', 'PICKUP']),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(4).max(30),
  customerEmail: z.string().email().optional().or(z.literal('')),
  street: z.string().max(120).optional().or(z.literal('')),
  zip: z.string().max(10).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  note: z.string().max(500).optional().or(z.literal('')),
  paymentMethod: z.enum(['CASH', 'CARD']),
  items: z.array(CartItemSchema).min(1).max(50),
});

export type PlaceOrderResult =
  | { ok: true; publicId: string }
  | { ok: false; error: string };

export async function placeOrder(
  input: z.infer<typeof CheckoutSchema>,
): Promise<PlaceOrderResult> {
  const parsed = CheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Ungültige Bestelldaten.' };
  }
  const data = parsed.data;

  if (data.method === 'DELIVERY' && (!data.street || !data.zip || !data.city)) {
    return { ok: false, error: 'Lieferadresse ist unvollständig.' };
  }

  // Re-price on server to prevent client tampering
  const items = data.items
    .map((i) => {
      const product = getProduct(i.productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name.de,
        quantity: i.quantity,
        unitCents: product.priceCents,
        totalCents: product.priceCents * i.quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) {
    return { ok: false, error: 'Warenkorb leer.' };
  }

  const subtotalCents = items.reduce((s, i) => s + i.totalCents, 0);
  const deliveryCents = deliveryFor(subtotalCents, data.method);
  const totalCents = subtotalCents + deliveryCents;

  const session = await getSession();
  const publicId = generatePublicId();

  await prisma.order.create({
    data: {
      publicId,
      userId: session?.sub ?? null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail || null,
      method: data.method,
      street: data.method === 'DELIVERY' ? data.street || null : null,
      zip: data.method === 'DELIVERY' ? data.zip || null : null,
      city: data.method === 'DELIVERY' ? data.city || null : null,
      note: data.note || null,
      paymentMethod: data.paymentMethod,
      subtotalCents,
      deliveryCents,
      totalCents,
      items: { create: items },
    },
  });

  revalidatePath('/admin');
  revalidatePath('/account');
  return { ok: true, publicId };
}

export async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { ok: false, error: 'Forbidden' };
  }
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath('/admin');
  return { ok: true };
}
