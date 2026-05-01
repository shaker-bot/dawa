import type { ID, NewPatient, Note, Patient, Recording } from '@/types';

export interface PatientRepository {
  list(): Promise<Patient[]>;
  get(id: ID): Promise<Patient | null>;
  create(input: NewPatient): Promise<Patient>;
  update(id: ID, patch: Partial<Patient>): Promise<Patient>;
  remove(id: ID): Promise<void>;
  addNote(patientId: ID, body: string): Promise<Note>;
  updateNote(patientId: ID, noteId: ID, body: string): Promise<Note>;
  removeNote(patientId: ID, noteId: ID): Promise<void>;
  addRecording(patientId: ID, recording: Omit<Recording, 'id' | 'createdAt' | 'syncStatus'>): Promise<Recording>;
  removeRecording(patientId: ID, recordingId: ID): Promise<void>;
}
