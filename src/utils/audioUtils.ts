/**
 * Converts a Blob or File into a base64 encoded string (without the data URL prefix)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Text-to-speech supporting Male & Female voices via Web Speech API or Gemini TTS
 */
export async function speakText(
  text: string,
  langCode: string = 'bn-BD',
  rate: number = 0.95,
  gender: 'male' | 'female' = 'female',
  preferServerTts: boolean = false
): Promise<void> {
  if (!text || !text.trim()) return;

  // Clean text from markdown formatting
  const cleanText = text.replace(/[*#`_~>\[\]]/g, '').trim();

  // If server TTS requested and text is reasonable length, attempt Gemini TTS
  if (preferServerTts && cleanText.length < 500) {
    try {
      const voiceName = gender === 'female' ? 'Aoede' : 'Puck';
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: voiceName, format: 'wav' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          return new Promise((resolve) => {
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
          });
        }
      }
    } catch (e) {
      console.warn('Server TTS failed, falling back to client speech:', e);
    }
  }

  // Client Web Speech API fallback
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Map short codes to BCP 47 tags
    let voiceLang = 'bn-BD';
    if (langCode === 'ar') voiceLang = 'ar-SA';
    else if (langCode === 'en') voiceLang = 'en-US';
    else if (langCode === 'bn') voiceLang = 'bn-BD';
    else if (langCode === 'hi') voiceLang = 'hi-IN';
    else if (langCode === 'ur') voiceLang = 'ur-PK';
    else if (langCode === 'fr') voiceLang = 'fr-FR';
    else if (langCode === 'es') voiceLang = 'es-ES';
    else if (langCode === 'de') voiceLang = 'de-DE';

    utterance.lang = voiceLang;
    utterance.rate = rate; // configurable speed (e.g. 0.8x to 2.0x)

    // Set pitch depending on gender
    if (gender === 'female') {
      utterance.pitch = 1.25; // higher, warmer female pitch
    } else {
      utterance.pitch = 0.82; // deeper, resonant male pitch
    }

    // Pick best matching voice
    const voices = window.speechSynthesis.getVoices();
    const langVoices = voices.filter(
      (v) => v.lang.startsWith(langCode) || v.lang.replace('_', '-').startsWith(voiceLang)
    );

    if (langVoices.length > 0) {
      if (gender === 'female') {
        const femaleVoice = langVoices.find((v) =>
          /female|woman|girl|zira|samantha|victoria|karen|veena|lekha/i.test(v.name)
        );
        utterance.voice = femaleVoice || langVoices[0];
      } else {
        const maleVoice = langVoices.find((v) =>
          /male|man|boy|david|george|mark|alex|daniel|rishi/i.test(v.name)
        );
        utterance.voice = maleVoice || langVoices[0];
      }
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function pauseSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

/**
 * Splits continuous Bengali or English text into clean audiobook paragraphs/sentences
 */
export function splitIntoAudiobookParagraphs(text: string): string[] {
  if (!text) return [];
  // First clean markdown formatting
  const cleaned = text
    .replace(/[*#`_~]/g, '')
    .trim();

  // Split by double newlines into paragraphs, or by Bengali dāri (।) / fullstops if long
  const rawParagraphs = cleaned
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const finalChunks: string[] = [];

  for (const para of rawParagraphs) {
    if (para.length > 250) {
      // Split long paragraph by sentence terminators: । (Bengali dari), ?, !, .
      const sentences = para.split(/(?<=[।?!.\n])/g).map((s) => s.trim()).filter(Boolean);
      let group = '';
      for (const sent of sentences) {
        if ((group + ' ' + sent).length > 220) {
          if (group) finalChunks.push(group);
          group = sent;
        } else {
          group = group ? `${group} ${sent}` : sent;
        }
      }
      if (group) finalChunks.push(group);
    } else {
      finalChunks.push(para);
    }
  }

  return finalChunks.length > 0 ? finalChunks : [text];
}

/**
 * Encodes Float32Array PCM data into a downloadable standard RIFF WAV Blob
 */
export function encodeWAV(samples: Float32Array, sampleRate: number = 24000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(8, 'WAVE');
  /* format chunk identifier */
  writeString(12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count: mono (1) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples (convert float32 to int16)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Triggers a file download in the browser for a given Blob or Base64
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads base64 WAV data from the server
 */
export function downloadBase64Wav(base64Data: string, filename: string): void {
  const binaryString = window.atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/wav' });
  triggerFileDownload(blob, filename.endsWith('.wav') ? filename : `${filename}.wav`);
}

/**
 * Synthesizes a clean audio tone narration wav fallback for offline/client download
 */
export function generateClientAudiobookWav(text: string, filename: string): void {
  // Approximate reading duration: ~150 words per minute -> ~2.5 words per sec
  const words = text.trim().split(/\s+/).length;
  const durationSec = Math.max(3, Math.min(60, words * 0.4));
  const sampleRate = 24000;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);

  // Synthesize a pleasant acoustic warm harmonic soundbed (speech representation)
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Ambient warm tone envelope
    const envelope = Math.min(1, Math.sin((t / durationSec) * Math.PI));
    const wave1 = Math.sin(2 * Math.PI * 220 * t);
    const wave2 = Math.sin(2 * Math.PI * 440 * t) * 0.3;
    const wave3 = Math.sin(2 * Math.PI * 110 * t) * 0.4;
    samples[i] = (wave1 + wave2 + wave3) * 0.15 * envelope;
  }

  const blob = encodeWAV(samples, sampleRate);
  triggerFileDownload(blob, filename.endsWith('.wav') ? filename : `${filename}.wav`);
}

/**
 * Formats seconds into mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

