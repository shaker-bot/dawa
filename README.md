# Dawa

A cross-platform medical transcription and note-taking app for clinicians.
One TypeScript codebase ships to **web, iOS, and Android** via Expo + React
Native Web.

> ⚠️ **Not production-ready for PHI.** This repository is an MVP scaffold.
> Before handling real patient data, see [Production hardening](#production-hardening).

## Features

- **Per-patient workspace** — patient list, profile (name, MRN, DOB),
  free-form notes, and recorded consultations.
- **Audio-recorded consultations** — one-tap recording on web, iOS, and Android
  via `expo-av` with live duration display.
- **Broken-English friendly transcription** — OpenAI Whisper handles accents,
  disfluencies, code-switching, and mixed languages. A **Translate to English**
  toggle routes audio through Whisper's translation endpoint so non-English or
  broken-English speech comes back as clean English. A medical-domain prompt
  biases the model toward correct drug names, dosages, units, and anatomy.
- **Upload-ready storage seam** — local-first via AsyncStorage today, with a
  `PatientRepository` interface and `syncStatus` flags on every record so a
  remote backend can be added without touching the UI.

## Tech stack

| Concern             | Choice                                              |
| ------------------- | --------------------------------------------------- |
| Framework           | Expo SDK 51, Expo Router 3                          |
| Language            | TypeScript (strict)                                 |
| Native              | React Native 0.74                                   |
| Web                 | React Native Web                                    |
| Audio capture       | `expo-av`                                           |
| Local storage       | `@react-native-async-storage/async-storage`         |
| Transcription       | OpenAI Whisper (`whisper-1`)                        |

## Getting started

### Prerequisites

- Node 20+ and npm 10+
- An OpenAI API key with Whisper access (dev only — see security note below)
- For native: Xcode (iOS), Android Studio (Android), or the Expo Go app on a
  physical device

### Setup

```bash
git clone <this-repo>
cd dawa
npm install
cp .env.example .env
# edit .env and set EXPO_PUBLIC_OPENAI_API_KEY
```

### Run

```bash
npm run web       # browser
npm run ios       # iOS simulator
npm run android   # Android emulator
npm start         # Expo dev menu (pick a target)
```

### Type-check

```bash
npm run typecheck
```

## Project layout

```
app/                          Expo Router screens
  _layout.tsx                 Root stack
  index.tsx                   Patient list
  patient/new.tsx             New patient (modal)
  patient/[id].tsx            Patient detail: record, transcribe, notes

src/
  components/
    AudioRecorder.tsx         Cross-platform mic capture (web + native)
  storage/
    PatientRepository.ts      Storage interface
    LocalPatientRepository.ts AsyncStorage implementation
    index.ts                  Singleton export
  transcription/
    whisper.ts                Whisper API client (transcribe + translate)
  types.ts                    Patient, Note, Recording, SyncStatus

app.json                      Expo config (permissions, plugins)
babel.config.js
tsconfig.json
```

## How transcription handles broken English

`src/transcription/whisper.ts` exposes `transcribeAudio({ uri, mimeType,
translateToEnglish })`. Two strategies are available:

1. **Translate to English (default)** — POSTs to
   `/v1/audio/translations`. Whisper auto-detects the source language,
   tolerates accented and disfluent speech, and returns English text. Best
   when the speaker mixes languages or uses broken English.
2. **Transcribe in source language** — POSTs to `/v1/audio/transcriptions`.
   Output preserves the original language (useful when the clinician needs
   verbatim records).

Both calls send a medical-domain `prompt` so Whisper biases toward clinical
vocabulary, drug names, ICD/CPT codes, vital signs, and units.

## Storage and future cloud upload

Every record carries a `syncStatus`:

```ts
type SyncStatus = 'local' | 'pending-upload' | 'uploaded' | 'failed';
```

`localPatientRepository` always writes `syncStatus: 'local'`. To add a cloud
backend later:

1. Implement `PatientRepository` against your API (e.g., `RemotePatientRepository`).
2. Or implement a sync worker that watches for `local` records, uploads them,
   and flips them to `uploaded`.
3. Swap or compose the export in `src/storage/index.ts`. Screens consume the
   interface and don't need changes.

## Production hardening

This MVP is **not** ready for real PHI. Before any clinical use:

- **Move the OpenAI key off-device.** `EXPO_PUBLIC_*` vars ship to clients.
  Replace the direct Whisper call with a server you control that holds the key
  and forwards audio.
- **Sign a BAA** with your transcription provider (OpenAI offers BAAs on
  enterprise plans; alternatives: AWS Transcribe Medical, Azure Speech, Google
  Healthcare NL).
- **Encrypt at rest.** Use `expo-secure-store` for secrets and SQLCipher (or
  equivalent) for the patient store instead of AsyncStorage.
- **Encrypt in transit.** TLS only; pin certificates on native if your threat
  model requires it.
- **Authenticate clinicians.** Add SSO/OIDC, session timeouts, and per-user
  audit logging of all reads/writes.
- **Add an audit trail** for record access, edits, exports, and deletions.
- **Region-pin** storage and processing to satisfy data-residency rules.
- **Consent capture** before recording any patient.

## Roadmap

- [ ] Backend proxy for Whisper (remove client-side API key)
- [ ] `RemotePatientRepository` + background sync worker
- [ ] Audit log
- [ ] Authentication (SSO/OIDC)
- [ ] Encrypted local store (SQLCipher / `expo-sqlite` + key from secure store)
- [ ] Edit notes inline; rich text or templated SOAP notes
- [ ] Speaker diarization (clinician vs. patient)
- [ ] Export to PDF / FHIR `DocumentReference`

## License

TBD.
