import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ID, NewPatient, Note, Patient, Recording } from '@/types';
import type { PatientRepository } from './PatientRepository';

const STORAGE_KEY = 'dawa.patients.v1';

const newId = (): string =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const now = () => new Date().toISOString();

async function readAll(): Promise<Patient[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Patient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(patients: Patient[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

async function mutatePatient(
  id: ID,
  mutator: (p: Patient) => Patient
): Promise<Patient> {
  const all = await readAll();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(`Patient ${id} not found`);
  const updated = mutator(all[index]);
  all[index] = { ...updated, updatedAt: now() };
  await writeAll(all);
  return all[index];
}

export const localPatientRepository: PatientRepository = {
  async list() {
    const all = await readAll();
    return [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    const all = await readAll();
    return all.find((p) => p.id === id) ?? null;
  },

  async create(input: NewPatient) {
    const patient: Patient = {
      id: newId(),
      name: input.name.trim(),
      mrn: input.mrn?.trim() || undefined,
      dateOfBirth: input.dateOfBirth?.trim() || undefined,
      notes: [],
      recordings: [],
      createdAt: now(),
      updatedAt: now(),
      syncStatus: 'local',
    };
    const all = await readAll();
    await writeAll([patient, ...all]);
    return patient;
  },

  async update(id, patch) {
    return mutatePatient(id, (p) => ({ ...p, ...patch }));
  },

  async remove(id) {
    const all = await readAll();
    await writeAll(all.filter((p) => p.id !== id));
  },

  async addNote(patientId, body) {
    const note: Note = { id: newId(), body, createdAt: now(), updatedAt: now() };
    await mutatePatient(patientId, (p) => ({ ...p, notes: [note, ...p.notes] }));
    return note;
  },

  async updateNote(patientId, noteId, body) {
    let updated: Note | null = null;
    await mutatePatient(patientId, (p) => ({
      ...p,
      notes: p.notes.map((n) => {
        if (n.id !== noteId) return n;
        updated = { ...n, body, updatedAt: now() };
        return updated;
      }),
    }));
    if (!updated) throw new Error(`Note ${noteId} not found`);
    return updated;
  },

  async removeNote(patientId, noteId) {
    await mutatePatient(patientId, (p) => ({
      ...p,
      notes: p.notes.filter((n) => n.id !== noteId),
    }));
  },

  async addRecording(patientId, recording) {
    const full: Recording = {
      ...recording,
      id: newId(),
      createdAt: now(),
      syncStatus: 'local',
    };
    await mutatePatient(patientId, (p) => ({
      ...p,
      recordings: [full, ...p.recordings],
    }));
    return full;
  },

  async removeRecording(patientId, recordingId) {
    await mutatePatient(patientId, (p) => ({
      ...p,
      recordings: p.recordings.filter((r) => r.id !== recordingId),
    }));
  },
};
