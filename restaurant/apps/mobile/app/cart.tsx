import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useCart } from '../lib/cart';
import { formatPrice } from '@bykebap/menu';

export default function CartScreen() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.subtotalCents());

  if (items.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Dein Warenkorb ist leer</Text>
        <Link href="/menu" asChild>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Zur Speisekarte</Text>
          </Pressable>
        </Link>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.list}>
        {items.map((i) => (
          <View key={i.productId} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{i.name}</Text>
              <Text style={styles.price}>{formatPrice(i.unitCents)}</Text>
            </View>
            <View style={styles.qty}>
              <Pressable onPress={() => setQty(i.productId, i.quantity - 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>−</Text>
              </Pressable>
              <Text style={styles.qtyText}>{i.quantity}</Text>
              <Pressable onPress={() => setQty(i.productId, i.quantity + 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyBtnText}>+</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => remove(i.productId)}>
              <Text style={styles.remove}>×</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gesamt</Text>
          <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
        </View>
        <Pressable style={styles.checkout}>
          <Text style={styles.checkoutText}>Zur Kasse →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF6F1' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#1A1612' },
  price: { fontSize: 13, color: '#5E544A', marginTop: 2 },
  qty: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2EBE0',
    borderRadius: 999,
    padding: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1612' },
  qtyText: { fontSize: 15, fontWeight: '800', minWidth: 18, textAlign: 'center' },
  remove: { fontSize: 24, color: '#9F968D', paddingHorizontal: 4 },
  summary: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#3A332C',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  totalLabel: { fontSize: 14, color: '#5E544A' },
  totalValue: { fontSize: 26, fontWeight: '900', color: '#1A1612' },
  checkout: {
    backgroundColor: '#C8102E',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  checkoutText: { color: '#FAF6F1', fontWeight: '800', fontSize: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF6F1' },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1612', marginBottom: 20 },
  cta: {
    backgroundColor: '#C8102E',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  ctaText: { color: '#FAF6F1', fontWeight: '700' },
});
