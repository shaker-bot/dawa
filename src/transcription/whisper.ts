import { Platform } from 'react-native';

const ENDPOINT_TRANSCRIBE = 'https://api.openai.com/v1/audio/transcriptions';
const ENDPOINT_TRANSLATE = 'https://api.openai.com/v1/audio/translations';

const MEDICAL_PROMPT =
  'Clinical consultation. Speakers may use broken English, mixed languages, ' +
  'disfluencies, or accented speech. Preserve medical terminology, drug names, ' +
  'dosages, ICD/CPT codes, anatomical terms, vital signs, and units exactly.';

export interface TranscribeOptions {
  uri: string;
  mimeType?: string;
  fileName?: string;
  translateToEnglish?: boolean;
  language?: string;
  apiKey?: string;
}

export interface TranscribeResult {
  text: string;
  language?: string;
}

function getApiKey(explicit?: string): string {
  const key = explicit ?? process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OpenAI API key missing. Set EXPO_PUBLIC_OPENAI_API_KEY in your environment.'
    );
  }
  return key;
}

async function buildFilePart(
  uri: string,
  mimeType: string,
  fileName: string
): Promise<Blob | { uri: string; name: string; type: string }> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.blob();
  }
  return { uri, name: fileName, type: mimeType };
}

export async function transcribeAudio(
  opts: TranscribeOptions
): Promise<TranscribeResult> {
  const apiKey = getApiKey(opts.apiKey);
  const mimeType = opts.mimeType ?? 'audio/m4a';
  const fileName = opts.fileName ?? `recording.${mimeType.split('/')[1] ?? 'm4a'}`;

  const form = new FormData();
  const filePart = await buildFilePart(opts.uri, mimeType, fileName);
  // FormData typings differ between web (Blob) and RN (object); cast safely.
  form.append('file', filePart as Blob, fileName);
  form.append('model', 'whisper-1');
  form.append('prompt', MEDICAL_PROMPT);
  form.append('response_format', 'verbose_json');
  form.append('temperature', '0');

  const url = opts.translateToEnglish ? ENDPOINT_TRANSLATE : ENDPOINT_TRANSCRIBE;
  if (!opts.translateToEnglish && opts.language) {
    form.append('language', opts.language);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Whisper request failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { text: string; language?: string };
  return { text: json.text?.trim() ?? '', language: json.language };
}
