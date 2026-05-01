import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { patientRepository } from '@/storage';

export default function NewPatientScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mrn, setMrn] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const patient = await patientRepository.create({
        name,
        mrn: mrn || undefined,
        dateOfBirth: dob || undefined,
      });
      router.replace(`/patient/${patient.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save patient.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Field label="Full name" value={name} onChangeText={setName} autoFocus />
        <Field label="MRN (optional)" value={mrn} onChangeText={setMrn} />
        <Field
          label="Date of birth (optional)"
          value={dob}
          onChangeText={setDob}
          placeholder="YYYY-MM-DD"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [styles.button, (pressed || saving) && styles.buttonPressed]}
        >
          <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Save patient'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

function Field({ label, value, onChangeText, placeholder, autoFocus }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, color: '#445', fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dde2e8',
  },
  error: { color: '#b03030' },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
