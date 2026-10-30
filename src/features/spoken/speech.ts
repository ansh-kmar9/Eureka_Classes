// Browser-only helpers: they use the phone's own text-to-speech and speech recognition,
// so they cost nothing and nothing is sent to our servers.

interface RecognitionResultItem {
  transcript: string;
}
interface RecognitionEvent {
  results: ArrayLike<ArrayLike<RecognitionResultItem>>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionConstructor = new () => Recognition;

const recognitionConstructor = (): RecognitionConstructor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

/** True if this device can read English aloud. */
export const canSpeak = (): boolean =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance !== "undefined";

/** True if this device can turn the student's speech into text (Chrome on Android, mostly). */
export const canListen = (): boolean => Boolean(recognitionConstructor());

/** Prefers an Indian English voice, since that is what students are used to hearing. */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  for (const preferred of ["en-in", "en-gb", "en-us"]) {
    const match = english.find((voice) => voice.lang.toLowerCase().replace("_", "-") === preferred);
    if (match) return match;
  }
  return english[0];
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

/** Reads `text` aloud. Resolves when it finishes (or straight away if speech is unavailable). */
export function speak(text: string, options: { slow?: boolean } = {}): Promise<void> {
  if (!canSpeak()) return Promise.resolve();

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = options.slow ? 0.65 : 0.92;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export type ListenResult =
  | { ok: true; heard: string[] }
  | { ok: false; reason: "denied" | "nospeech" | "unsupported" | "error" };

/** Listens once and returns what the recogniser thinks was said, best guess first. */
export function listen(): Promise<ListenResult> {
  const Recognizer = recognitionConstructor();
  if (!Recognizer) return Promise.resolve({ ok: false, reason: "unsupported" });

  return new Promise((resolve) => {
    const recognition = new Recognizer();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let result: ListenResult = { ok: false, reason: "nospeech" };
    // A safety net: never leave the microphone open if the browser forgets to stop.
    const timer = setTimeout(() => recognition.stop(), 9000);

    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results[0] ?? []).map((item) => item.transcript);
      if (alternatives.length) result = { ok: true, heard: alternatives };
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        result = { ok: false, reason: "denied" };
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        result = { ok: false, reason: "error" };
      }
    };
    recognition.onend = () => {
      clearTimeout(timer);
      resolve(result);
    };

    try {
      recognition.start();
    } catch {
      clearTimeout(timer);
      resolve({ ok: false, reason: "error" });
    }
  });
}
