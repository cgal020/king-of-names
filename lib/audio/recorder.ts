// Browser only. Records a voice note with MediaRecorder, reports the voice
// level for the record button's halo, and stops itself at the time cap.

export const MAX_SECONDS = 90;

// Formats in order of preference. Chrome and Android record WebM/Opus; iPhone
// Safari records MP4/AAC. Never Ogg: Safari fails to record it, and the
// transcription API doesn't accept it.
const CANDIDATES = ["audio/webm;codecs=opus", "audio/mp4", "audio/mp4;codecs=mp4a.40.2", "audio/webm"];

export function pickMimeType(isTypeSupported: (type: string) => boolean) {
  return CANDIDATES.find((type) => isTypeSupported(type)) ?? null;
}

export function canRecordAudio() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined" &&
    pickMimeType((t) => MediaRecorder.isTypeSupported(t)) !== null
  );
}

export type RecordingResult = { blob: Blob; mime: string; durationSeconds: number };

export type Recording = {
  stop: () => Promise<RecordingResult>;
  cancel: () => void;
};

type Options = {
  onLevel?: (level: number) => void;
  onAutoStop?: (result: RecordingResult) => void;
  maxSeconds?: number;
};

// Starts recording. Call it from a tap: browsers only grant the microphone
// after a user gesture, and iOS re-asks in Home Screen apps.
export async function startRecording({ onLevel, onAutoStop, maxSeconds = MAX_SECONDS }: Options = {}): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  const mimeType = pickMimeType((t) => MediaRecorder.isTypeSupported(t))!;
  // 32 kbps is plenty for speech: 90 seconds is about 360 KB.
  const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  // Voice level from an analyser, smoothed for a calm halo.
  const audio = new AudioContext();
  const analyser = audio.createAnalyser();
  analyser.fftSize = 512;
  audio.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let level = 0;
  let frame = 0;
  const tick = () => {
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const s of samples) sum += s * s;
    const rms = Math.sqrt(sum / samples.length);
    level = level * 0.7 + Math.min(1, rms * 6) * 0.3;
    onLevel?.(level);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  // Keep the screen on while recording; fine if the browser says no.
  const wakeLock = await navigator.wakeLock?.request("screen").catch(() => null);

  const startedAt = performance.now();
  recorder.start(1000);

  let finished: Promise<RecordingResult> | null = null;
  const cleanUp = () => {
    cancelAnimationFrame(frame);
    stream.getTracks().forEach((t) => t.stop());
    void audio.close();
    void wakeLock?.release().catch(() => {});
    window.clearTimeout(cap);
  };

  const stop = () => {
    finished ??= new Promise<RecordingResult>((resolve) => {
      recorder.onstop = () => {
        cleanUp();
        const mime = mimeType.split(";")[0];
        resolve({
          blob: new Blob(chunks, { type: mime }),
          mime,
          durationSeconds: Math.min(maxSeconds, (performance.now() - startedAt) / 1000),
        });
      };
      if (recorder.state !== "inactive") recorder.stop();
    });
    return finished;
  };

  const cap = window.setTimeout(() => {
    void stop().then((result) => onAutoStop?.(result));
  }, maxSeconds * 1000);

  return {
    stop,
    cancel: () => {
      recorder.onstop = cleanUp;
      if (recorder.state !== "inactive") recorder.stop();
      else cleanUp();
    },
  };
}
