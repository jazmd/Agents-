import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const BRAND = '#C8102E';
const CREAM = '#FAF6F1';
const CHARCOAL = '#1A1612';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: BRAND },
          headerTintColor: CREAM,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: CREAM },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'By Kebap' }} />
        <Stack.Screen name="menu" options={{ title: 'Speisekarte' }} />
        <Stack.Screen name="cart" options={{ title: 'Warenkorb' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

export const colors = { BRAND, CREAM, CHARCOAL };
