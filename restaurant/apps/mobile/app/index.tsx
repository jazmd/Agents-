import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories } from '@bykebap/menu';

export default function HomeScreen() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.kicker}>Frisch aus Paderborn</Text>
          <Text style={styles.title}>Vom Grill direkt zu dir</Text>
          <Text style={styles.subtitle}>
            Saftiges Kalbfleisch, hauchdünnes Yufka, hausgemachte Saucen.
          </Text>
          <Link href="/menu" asChild>
            <Pressable style={styles.cta}>
              <Text style={styles.ctaText}>Jetzt bestellen →</Text>
            </Pressable>
          </Link>
        </View>

        {/* CATEGORIES */}
        <Text style={styles.sectionTitle}>Kategorien</Text>
        <View style={styles.grid}>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/menu?cat=${cat.id}`} asChild>
              <Pressable style={styles.catCard}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text style={styles.catName}>{cat.name.de}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAF6F1' },
  content: { padding: 16, paddingBottom: 60 },
  hero: {
    backgroundColor: '#1A1612',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
  },
  kicker: {
    color: '#F4A623',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FAF6F1',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 36,
  },
  subtitle: { color: 'rgba(250,246,241,0.7)', marginTop: 8, fontSize: 14, lineHeight: 20 },
  cta: {
    marginTop: 20,
    backgroundColor: '#C8102E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  ctaText: { color: '#FAF6F1', fontWeight: '700' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1612',
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3A332C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  catEmoji: { fontSize: 32 },
  catName: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#1A1612', textAlign: 'center' },
});
