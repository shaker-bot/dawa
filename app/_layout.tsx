import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a7ea4' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Patients' }} />
        <Stack.Screen name="patient/new" options={{ title: 'New patient', presentation: 'modal' }} />
        <Stack.Screen name="patient/[id]" options={{ title: 'Patient' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
