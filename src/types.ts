export type ID = string;

export type SyncStatus = 'local' | 'pending-upload' | 'uploaded' | 'failed';

export interface Patient {
  id: ID;
  name: string;
  mrn?: string;
  dateOfBirth?: string;
  notes: Note[];
  recordings: Recording[];
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Note {
  id: ID;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recording {
  id: ID;
  uri: string;
  durationMs: number;
  transcript: string;
  language?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export type NewPatient = Pick<Patient, 'name'> & Partial<Pick<Patient, 'mrn' | 'dateOfBirth'>>;
