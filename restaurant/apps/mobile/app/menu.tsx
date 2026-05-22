import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { categories, products, formatPrice, type Product } from '@bykebap/menu';
import { useCart } from '../lib/cart';

export default function MenuScreen() {
  const params = useLocalSearchParams<{ cat?: string }>();
  const [activeCat, setActiveCat] = useState<string>(
    params.cat ?? categories[0]?.id ?? 'doener',
  );
  const visible = useMemo(
    () => products.filter((p) => p.categoryId === activeCat),
    [activeCat],
  );
  const count = useCart((s) => s.count());

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
        {categories.map((cat) => {
          const active = cat.id === activeCat;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setActiveCat(cat.id)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {cat.icon} {cat.name.de}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {visible.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      {count > 0 && (
        <Link href="/cart" asChild>
          <Pressable style={styles.cartFab}>
            <Text style={styles.cartFabText}>Warenkorb · {count}</Text>
          </Pressable>
        </Link>
      )}
    </SafeAreaView>
  );
}

function ProductRow({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{product.name.de}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>
          {product.description.de}
        </Text>
        <Text style={styles.rowPrice}>{formatPrice(product.priceCents)}</Text>
      </View>
      <Pressable
        onPress={() =>
          add({ productId: product.id, name: product.name.de, unitCents: product.priceCents })
        }
        style={styles.addBtn}
      >
        <Text style={styles.addBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF6F1' },
  pills: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 0 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2DDD8',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  pillActive: { backgroundColor: '#C8102E', borderColor: '#C8102E' },
  pillText: { fontSize: 13, fontWeight: '700', color: '#3A332C' },
  pillTextActive: { color: '#FAF6F1' },
  list: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: '800', color: '#1A1612' },
  rowDesc: { fontSize: 13, color: '#5E544A', marginTop: 2 },
  rowPrice: { fontSize: 16, fontWeight: '800', color: '#1A1612', marginTop: 6 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1612',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#FAF6F1', fontSize: 22, lineHeight: 24, fontWeight: '700' },
  cartFab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#C8102E',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#C8102E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  cartFabText: { color: '#FAF6F1', fontWeight: '800', fontSize: 15 },
});
