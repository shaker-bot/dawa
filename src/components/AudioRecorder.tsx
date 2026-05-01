import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export interface RecordingResult {
  uri: string;
  durationMs: number;
  mimeType: string;
}

interface Props {
  onRecorded: (result: RecordingResult) => void;
  busy?: boolean;
  busyLabel?: string;
}

function inferMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0];
  switch (ext) {
    case 'm4a':
    case 'mp4':
      return 'audio/m4a';
    case 'webm':
      return 'audio/webm';
    case 'wav':
      return 'audio/wav';
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
      return 'audio/ogg';
    default:
      return Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
  }
}

export function AudioRecorder({ onRecorded, busy, busyLabel }: Props) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  async function start() {
    setError(null);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError('Microphone permission denied.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording) setElapsedMs(status.durationMillis ?? 0);
        },
        200
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setElapsedMs(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start recording.');
    }
  }

  async function stop() {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      if (!uri) {
        setError('Recording produced no file.');
        return;
      }
      onRecorded({
        uri,
        durationMs: status.durationMillis ?? elapsedMs,
        mimeType: inferMimeType(uri),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to stop recording.');
      setIsRecording(false);
    }
  }

  const seconds = Math.floor(elapsedMs / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Pressable
        onPress={isRecording ? stop : start}
        disabled={busy}
        style={({ pressed }) => [
          styles.button,
          isRecording ? styles.buttonStop : styles.buttonStart,
          (pressed || busy) && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonLabel}>
            {isRecording ? `Stop  ${mm}:${ss}` : 'Record consultation'}
          </Text>
        )}
      </Pressable>
      {busy && busyLabel ? <Text style={styles.busyLabel}>{busyLabel}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStart: { backgroundColor: '#0a7ea4' },
  buttonStop: { backgroundColor: '#b03030' },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: { color: '#fff', fontWeight: '600', fontSize: 16 },
  busyLabel: { color: '#555', fontSize: 13 },
  error: { color: '#b03030', fontSize: 13 },
});
