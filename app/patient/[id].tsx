import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioRecorder, type RecordingResult } from '@/components/AudioRecorder';
import { patientRepository } from '@/storage';
import { transcribeAudio } from '@/transcription/whisper';
import type { Note, Patient, Recording } from '@/types';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [translateToEnglish, setTranslateToEnglish] = useState(true);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setPatient(await patientRepository.get(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!id) return null;

  async function handleAddNote() {
    if (!patient || !noteDraft.trim()) return;
    await patientRepository.addNote(patient.id, noteDraft.trim());
    setNoteDraft('');
    await load();
  }

  async function handleDeleteNote(note: Note) {
    if (!patient) return;
    await patientRepository.removeNote(patient.id, note.id);
    await load();
  }

  async function handleRecorded(result: RecordingResult) {
    if (!patient) return;
    setError(null);
    setTranscribing(true);
    try {
      const { text, language } = await transcribeAudio({
        uri: result.uri,
        mimeType: result.mimeType,
        translateToEnglish,
      });
      await patientRepository.addRecording(patient.id, {
        uri: result.uri,
        durationMs: result.durationMs,
        transcript: text,
        language,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  }

  async function handleDeleteRecording(rec: Recording) {
    if (!patient) return;
    await patientRepository.removeRecording(patient.id, rec.id);
    await load();
  }

  function confirmDeletePatient() {
    if (!patient) return;
    const doDelete = async () => {
      await patientRepository.remove(patient.id);
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((globalThis as any).confirm?.('Delete this patient and all their data?')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Delete patient?', 'This removes all notes and recordings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: patient.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.name}>{patient.name}</Text>
          {patient.mrn ? <Text style={styles.meta}>MRN {patient.mrn}</Text> : null}
          {patient.dateOfBirth ? <Text style={styles.meta}>DOB {patient.dateOfBirth}</Text> : null}
        </View>

        <Section title="Record consultation">
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Translate to English</Text>
              <Text style={styles.toggleHelp}>
                On: handles broken English, accents, and other languages — outputs English.
                Off: preserves the speaker's original language.
              </Text>
            </View>
            <Switch value={translateToEnglish} onValueChange={setTranslateToEnglish} />
          </View>
          <AudioRecorder
            onRecorded={handleRecorded}
            busy={transcribing}
            busyLabel={transcribing ? 'Transcribing…' : undefined}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Section>

        <Section title={`Recordings (${patient.recordings.length})`}>
          {patient.recordings.length === 0 ? (
            <Text style={styles.muted}>No recordings yet.</Text>
          ) : (
            patient.recordings.map((rec) => (
              <View key={rec.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardMeta}>
                    {new Date(rec.createdAt).toLocaleString()} ·{' '}
                    {Math.round(rec.durationMs / 1000)}s
                    {rec.language ? ` · ${rec.language}` : ''}
                  </Text>
                  <Pressable onPress={() => handleDeleteRecording(rec)} hitSlop={8}>
                    <Text style={styles.delete}>Delete</Text>
                  </Pressable>
                </View>
                <Text style={styles.transcript}>
                  {rec.transcript || '(empty transcript)'}
                </Text>
              </View>
            ))
          )}
        </Section>

        <Section title={`Notes (${patient.notes.length})`}>
          <TextInput
            value={noteDraft}
            onChangeText={setNoteDraft}
            placeholder="Add a note…"
            multiline
            style={styles.noteInput}
          />
          <Pressable
            onPress={handleAddNote}
            disabled={!noteDraft.trim()}
            style={({ pressed }) => [
              styles.addButton,
              (pressed || !noteDraft.trim()) && styles.addButtonDisabled,
            ]}
          >
            <Text style={styles.addButtonLabel}>Add note</Text>
          </Pressable>
          {patient.notes.map((note) => (
            <View key={note.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardMeta}>
                  {new Date(note.createdAt).toLocaleString()}
                </Text>
                <Pressable onPress={() => handleDeleteNote(note)} hitSlop={8}>
                  <Text style={styles.delete}>Delete</Text>
                </Pressable>
              </View>
              <Text style={styles.noteBody}>{note.body}</Text>
            </View>
          ))}
        </Section>

        <Pressable
          onPress={confirmDeletePatient}
          style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.dangerLabel}>Delete patient</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 18, paddingBottom: 48 },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#dde2e8',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  meta: { fontSize: 14, color: '#667' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#334', textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#222' },
  toggleHelp: { fontSize: 12, color: '#667', marginTop: 2 },
  error: { color: '#b03030' },
  muted: { color: '#778', fontStyle: 'italic' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dde2e8',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { fontSize: 12, color: '#778' },
  delete: { color: '#b03030', fontWeight: '600', fontSize: 13 },
  transcript: { fontSize: 15, color: '#222', lineHeight: 21 },
  noteBody: { fontSize: 15, color: '#222', lineHeight: 21 },
  noteInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#dde2e8',
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonLabel: { color: '#fff', fontWeight: '600' },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#b03030',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.7 },
  dangerLabel: { color: '#b03030', fontWeight: '600' },
});
