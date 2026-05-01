export type { PatientRepository } from './PatientRepository';
export { localPatientRepository } from './LocalPatientRepository';

import { localPatientRepository } from './LocalPatientRepository';

export const patientRepository = localPatientRepository;
