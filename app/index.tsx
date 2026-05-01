import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { patientRepository } from '@/storage';
import type { Patient } from '@/types';

export default function PatientListScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setPatients(await patientRepository.list());
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={patients.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No patients yet</Text>
            <Text style={styles.emptyBody}>
              Add your first patient to start transcribing consultations.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/patient/${item.id}`)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <View style={styles.rowMain}>
              <Text style={styles.name}>{item.name}</Text>
              {item.mrn ? <Text style={styles.meta}>MRN {item.mrn}</Text> : null}
              <Text style={styles.meta}>
                {item.notes.length} note{item.notes.length === 1 ? '' : 's'} ·{' '}
                {item.recordings.length} recording{item.recordings.length === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <Link href="/patient/new" asChild>
        <Pressable style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
          <Text style={styles.fabLabel}>+ New patient</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  listContent: { paddingVertical: 8 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#222' },
  emptyBody: { fontSize: 14, color: '#666', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dde2e8',
  },
  rowPressed: { backgroundColor: '#eef3f7' },
  rowMain: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: '#111' },
  meta: { fontSize: 13, color: '#667' },
  chevron: { fontSize: 24, color: '#aab' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  fabPressed: { opacity: 0.85 },
  fabLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
