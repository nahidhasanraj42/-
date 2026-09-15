import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Shield,
  Radio,
  Clock,
  ArrowRightLeft,
  Copy,
  Check,
  BookmarkPlus,
  Download,
  Trash2,
  Settings2,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { InEarSegment, TranslationResult } from '../types';
import { useBackHandler } from '../utils/backNavigation';

interface EarphoneInterpreterProps {
  targetLang?: string;
  onSaveResult?: (result: TranslationResult) => void;
  onSaveToNotebook?: (
    title: string,
    content: string,
    category?: any,
    originalText?: string
  ) => void;
}

export const EarphoneInterpreter: React.FC<EarphoneInterpreterProps> = ({
  targetLang = 'bn',
  onSaveResult,
  onSaveToNotebook,
}) => {
  // Session State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [sessionMode, setSessionMode] = useState<'one-way' | 'two-way'>('one-way');
  const [activeSpeaker, setActiveSpeaker] = useState<'counterpart' | 'user'>('counterpart');
  const [counterpartLangHint, setCounterpartLangHint] = useState<string>('auto');
  
  // Audio & Earphone settings
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [speechRate, setSpeechRate] = useState<number>(1.1); // 1.1x is ideal brisk tempo for simultaneous interpreting
  const [isEarphoneConnected, setIsEarphoneConnected] = useState<boolean>(true);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  
  // Real-time audio stream & visualizer
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([12, 20, 28, 45, 58, 38, 22, 18, 26, 42, 54, 30, 18, 14]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [liveInterimText, setLiveInterimText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('দোভাষী প্রস্তুত। শুরু করতে মাইক্রোফোন বাটন চাপুন।');
  
  // Transcript & Segments
  const [segments, setSegments] = useState<InEarSegment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNotebookId, setSavedNotebookId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Internal refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksAccumulator = useRef<Blob[]>([]);
  const currentMimeTypeRef = useRef<string>('audio/webm');
  const segmentIdCounter = useRef<number>(1);
  const audioQueueRef = useRef<{ id: string; text: string; lang: string }[]>([]);
  const isAudioQueuePlaying = useRef<boolean>(false);
  const transcriptBottomRef = useRef<HTMLDivElement | null>(null);
  const isProcessingChunk = useRef<boolean>(false);

  // Check audio output devices
  useEffect(() => {
    const checkAudioDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasHeadphones = devices.some(
            (d) =>
              d.kind === 'audiooutput' &&
              (d.label.toLowerCase().includes('headphone') ||
                d.label.toLowerCase().includes('headset') ||
                d.label.toLowerCase().includes('airpod') ||
                d.label.toLowerCase().includes('earphone') ||
                d.label.toLowerCase().includes('bluetooth'))
          );
          setIsEarphoneConnected(hasHeadphones || true); // fallback true for web
        }
      } catch {
        setIsEarphoneConnected(true);
      }
    };
    checkAudioDevices();
  }, []);

  // Back button handler stops active interpretation if running
  useBackHandler(
    () => {
      if (isActive) {
        stopSession();
        return true;
      }
      return false;
    },
    45,
    isActive,
    'earphone-interpreter-active'
  );

  // Auto scroll transcript to bottom
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, liveInterimText]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSession();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Earphone chime test
  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);

      // Also speak a short confirmation into earphone
      speakIntoEarphone('ভাষানিধি কানে কানে দোভাষী প্রস্তুত', 'bn', 'test');
    } catch {
      // ignore
    }
  };

  // Dedicated in-ear TTS speech player with queue
  const speakIntoEarphone = (text: string, langCode: string = 'bn', segmentId: string) => {
    if (!text || !window.speechSynthesis) return;

    audioQueueRef.current.push({ id: segmentId, text, lang: langCode });
    processAudioQueue();
  };

  const processAudioQueue = () => {
    if (isAudioQueuePlaying.current || audioQueueRef.current.length === 0) return;

    const nextItem = audioQueueRef.current.shift();
    if (!nextItem) return;

    isAudioQueuePlaying.current = true;
    setCurrentlyPlayingId(nextItem.id);

    // Update segment state
    setSegments((prev) =>
      prev.map((s) => (s.id === nextItem.id ? { ...s, isPlaying: true } : s))
    );

    const utterance = new SpeechSynthesisUtterance(nextItem.text);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.lang = nextItem.lang === 'bn' ? 'bn-BD' : nextItem.lang;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes(nextItem.lang.toLowerCase()) ||
        v.name.toLowerCase().includes('bengali') ||
        v.name.toLowerCase().includes('bangla')
    );
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onend = () => {
      isAudioQueuePlaying.current = false;
      setCurrentlyPlayingId(null);
      setSegments((prev) =>
        prev.map((s) => (s.id === nextItem.id ? { ...s, isPlaying: false, audioPlayed: true } : s))
      );
      // Play next in queue
      setTimeout(processAudioQueue, 150);
    };

    utterance.onerror = () => {
      isAudioQueuePlaying.current = false;
      setCurrentlyPlayingId(null);
      setSegments((prev) =>
        prev.map((s) => (s.id === nextItem.id ? { ...s, isPlaying: false } : s))
      );
      processAudioQueue();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Replay a specific translated item in earphone
  const handleReplaySegment = (seg: InEarSegment) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      audioQueueRef.current = [];
      isAudioQueuePlaying.current = false;
    }
    speakIntoEarphone(seg.translatedText, targetLang, seg.id);
  };

  // Start the In-Ear Simultaneous Interpretation Session
  const startSession = async () => {
    try {
      setStatusMessage('মাইক্রোফোন চালু হচ্ছে...');
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      audioQueueRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio Context for Live Visualizer
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Visualizer loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const bars: number[] = [];
        const step = Math.floor(bufferLength / 14) || 1;
        for (let i = 0; i < 14; i++) {
          const val = dataArray[i * step] || 0;
          bars.push(Math.max(10, Math.round((val / 255) * 100)));
          sum += val;
        }
        setFrequencyBars(bars);
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      animFrameRef.current = requestAnimationFrame(updateMeter);

      // Determine best audio mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      let selectedMime = 'audio/webm';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }
      currentMimeTypeRef.current = selectedMime;

      // Browser Web Speech Recognition for instant interim preview
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang =
          activeSpeaker === 'user'
            ? 'bn-BD'
            : counterpartLangHint === 'ar'
            ? 'ar-SA'
            : counterpartLangHint === 'ur'
            ? 'ur-PK'
            : counterpartLangHint === 'en'
            ? 'en-US'
            : 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            interim += event.results[i][0].transcript;
          }
          setLiveInterimText(interim.trim());
        };

        recognition.onerror = () => {};
        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // ignore
        }
      }

      // MediaRecorder for chunk-based high-accuracy Gemini interpretation
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMime });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksAccumulator.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksAccumulator.current.push(event.data);
        }
      };

      mediaRecorder.start(500); // collect in 500ms slices

      // Processing cycle: fast cadence (every 3.2s) for instant simultaneous interpreting
      chunkTimerRef.current = setInterval(() => {
        processCurrentChunk();
      }, 3400);

      // Elapsed timer
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      setIsActive(true);
      setStatusMessage('🎧 কানে কানে দোভাষী সক্রিয়: কথা শুনছে এবং সাথে সাথে অনুবাদ করছে...');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('মাইক্রোফোন অনুমতি দেওয়া হয়নি বা কোনো ত্রুটি হয়েছে।');
    }
  };

  // Process chunk and send to backend
  const processCurrentChunk = async () => {
    if (isProcessingChunk.current) return;
    if (audioChunksAccumulator.current.length === 0) return;

    const currentBlob = new Blob(audioChunksAccumulator.current, {
      type: currentMimeTypeRef.current,
    });
    audioChunksAccumulator.current = [];

    // Ignore tiny silent blobs
    if (currentBlob.size < 2500) return;

    isProcessingChunk.current = true;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string)?.split(',')[1];
        if (!base64Data) {
          isProcessingChunk.current = false;
          return;
        }

        // Get recent context
        const recentContext = segments
          .slice(-2)
          .map((s) => `${s.speaker === 'user' ? 'প্রেসিডেন্ট' : 'বক্তা'}: ${s.originalText}`)
          .join(' | ');

        const response = await fetch('/api/interpreter/in-ear-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: currentMimeTypeRef.current,
            targetLang: targetLang,
            role: activeSpeaker,
            counterpartLang: counterpartLangHint,
            previousContext: recentContext,
          }),
        });

        if (!response.ok) {
          throw new Error('দোভাষী প্রক্রিয়াকরণে সমস্যা হয়েছে');
        }

        const data = await response.json();

        if (!data.isSilence && data.translation?.trim()) {
          const newSeg: InEarSegment = {
            id: `seg-${Date.now()}-${segmentIdCounter.current++}`,
            timestamp: Date.now(),
            timeFormatted: formatTime(elapsedSeconds),
            speaker: activeSpeaker,
            detectedLang: data.detectedLanguage || 'অজ্ঞাত ভাষা',
            originalText: data.transcription || liveInterimText || 'বক্তব্য ধারণকৃত',
            translatedText: data.translation,
            transliteration: data.transliteration,
            sentimentOrTone: data.sentimentOrTone,
            audioPlayed: false,
            isPlaying: false,
          };

          setSegments((prev) => [...prev, newSeg]);
          setLiveInterimText('');

          // AUTO-SPEAK into earphone!
          if (autoPlayAudio) {
            const cleanTextToPlay = data.ttsCleanText || data.translation;
            // If counterpart spoke, play Bengali into earphone
            // If user spoke in two-way mode, play translated counterpart language
            const audioLang = activeSpeaker === 'counterpart' ? targetLang : counterpartLangHint;
            speakIntoEarphone(cleanTextToPlay, audioLang, newSeg.id);
          }
        }
        isProcessingChunk.current = false;
      };
      reader.readAsDataURL(currentBlob);
    } catch (err) {
      console.error(err);
      isProcessingChunk.current = false;
    }
  };

  // Stop the session
  const stopSession = () => {
    setIsActive(false);
    setStatusMessage('দোভাষী সাময়িক স্থগিত রয়েছে।');

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    setLiveInterimText('');
    setAudioLevel(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Export full transcript
  const handleExportTranscript = () => {
    if (segments.length === 0) return;
    const lines = segments.map(
      (s) =>
        `[${s.timeFormatted}] ${s.speaker === 'user' ? 'প্রেসিডেন্ট / আপনি' : 'বিদেশী বক্তা'} (${s.detectedLang}):\n` +
        `মূল বক্তব্য: ${s.originalText}\n` +
        `কানে অনুবাদ: ${s.translatedText}\n` +
        (s.sentimentOrTone ? `টোন/ভাব: ${s.sentimentOrTone}\n` : '') +
        `----------------------------------------`
    );
    const content = `ভাষানিধি • কানে কানে দোভাষী (প্রেসিডেন্ট ইয়ারফোন মোড) সেশন ট্রান্সক্রিপ্ট\nতারিখ: ${new Date().toLocaleString('bn-BD')}\nমোট অনূদিত বাক্য: ${segments.length}টি\n\n${lines.join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `দোভাষী_ইয়ারফোন_সেশন_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Diplomatic In-Ear Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/30">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur">
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>প্রেসিডেন্ট ও ভিআইপি ইয়ারফোন মোড • Diplomatic In-Ear Interpreter</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-bengali tracking-tight text-white flex items-center gap-3">
              <span>কানে কানে দোভাষী</span>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold font-mono">
                REAL-TIME IN-EAR TTS
              </span>
            </h2>
          </div>

          {/* Earphone Status Box & Mode Switchers */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {/* Earphone Connection & Test Button */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-bengali flex items-center gap-1.5">
                    <span>ইয়ারফোন অডিও ফিড</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-emerald-200/80 font-bengali">
                    {autoPlayAudio ? 'স্বয়ংক্রিয় প্লেব্যাক সক্রিয়' : 'অডিও মিউট করা'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={playTestChime}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-colors font-bengali flex items-center gap-1"
                title="কানে অডিও পরীক্ষা করুন"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>টেস্ট অডিও</span>
              </button>
            </div>

            {/* Quick Speed & Auto Play controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold font-bengali transition-all flex items-center justify-center gap-1.5 border ${
                  autoPlayAudio
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                    : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/15'
                }`}
              >
                {autoPlayAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{autoPlayAudio ? 'ইয়ারফোন অডিও: অন' : 'ইয়ারফোন অডিও: বন্ধ'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                title="দোভাষীর স্পিড ও ভয়েস সেটিংস"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Drawer / Accordion */}
        {showSettings && (
          <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 p-4 rounded-2xl">
            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1.5 font-bengali">
                দোভাষীর উচ্চারণ গতি (TTS Speed)
              </label>
              <div className="flex items-center gap-2">
                {[1.0, 1.15, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      speechRate === rate
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {rate}x {rate === 1.15 ? 'কূটনৈতিক' : rate === 1.25 ? 'দ্রুত' : 'স্বাভাবিক'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1.5 font-bengali">
                বিদেশী বক্তার ভাষা (অনুমান)
              </label>
              <select
                value={counterpartLangHint}
                onChange={(e) => setCounterpartLangHint(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-800 border border-emerald-500/40 text-white p-1.5 font-bengali focus:outline-none"
              >
                <option value="auto">🌐 স্বয়ংক্রিয় শনাক্তকরণ (Auto Detect)</option>
                <option value="ar">🇸🇦 আরবি (Arabic - فصحى)</option>
                <option value="en">🇬🇧 ইংরেজি (English)</option>
                <option value="ur">🇵🇰 উর্দু (Urdu)</option>
                <option value="ru">🇷🇺 রাশিয়ান (Russian)</option>
                <option value="zh">🇨🇳 চাইনিজ (Mandarin)</option>
                <option value="fr">🇫🇷 ফরাসি (French)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-emerald-200 mb-1.5 font-bengali">
                অনুবাদ মোড নির্বাচন
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSessionMode('one-way')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all font-bengali ${
                    sessionMode === 'one-way'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  একমুখী (শ্রোতা)
                </button>
                <button
                  type="button"
                  onClick={() => setSessionMode('two-way')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all font-bengali ${
                    sessionMode === 'two-way'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  দ্বিমুখী (সংলাপ)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controller & Live Waveform Panel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          {/* Main Action Toggle: Start In-Ear Interpreting */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={isActive ? stopSession : startSession}
              className={`px-6 py-3.5 rounded-2xl font-bold font-bengali text-sm sm:text-base flex items-center gap-3 transition-all shadow-md active:scale-98 ${
                isActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 animate-pulse'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-200'
              }`}
            >
              {isActive ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>দোভাষী বিরতি দিন (Stop)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-emerald-300" />
                  <span>কানে কানে অনুবাদ শুরু করুন</span>
                </>
              )}
            </button>

            {isActive && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span className="font-mono text-sm text-emerald-900">{formatTime(elapsedSeconds)}</span>
              </div>
            )}
          </div>

          {/* Two-way Speaker Switcher (if Two-Way Mode is enabled) */}
          {sessionMode === 'two-way' && (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 font-bengali px-2">এখন কথা বলছেন:</span>
              <button
                type="button"
                onClick={() => setActiveSpeaker('counterpart')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-bengali transition-all ${
                  activeSpeaker === 'counterpart'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বিদেশী বক্তা (Foreigner)
              </button>
              <button
                type="button"
                onClick={() => setActiveSpeaker('user')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-bengali transition-all ${
                  activeSpeaker === 'user'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আপনি / প্রেসিডেন্ট
              </button>
            </div>
          )}

          {/* Transcript actions */}
          <div className="flex items-center gap-2">
            {segments.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleExportTranscript}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center gap-1.5 font-bengali"
                  title="ট্রান্সক্রিপ্ট ডাউনলোড করুন"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">ট্রান্সক্রিপ্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSegments([])}
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="তালিকা পরিষ্কার করুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Waveform & Status */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 font-bengali">
                  {isActive ? 'দোভাষী কান পেতে শুনছে...' : 'দোভাষী নিষ্ক্রিয়'}
                </span>
                {currentlyPlayingId && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 font-bengali">
                    <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
                    <span>কানে অডিও চলছে</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-bengali line-clamp-1">{statusMessage}</p>
            </div>
          </div>

          {/* Equalizer Frequency Bars */}
          <div className="flex items-end gap-1.5 h-9 px-4 py-1 rounded-xl bg-slate-950 border border-slate-800 w-full sm:w-64 justify-center">
            {frequencyBars.map((height, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: isActive ? `${height}%` : '15%',
                  backgroundColor: isActive
                    ? height > 60
                      ? '#34d399'
                      : height > 35
                      ? '#10b981'
                      : '#059669'
                    : '#334155',
                }}
              />
            ))}
          </div>
        </div>

        {/* Real-time Interim Live Preview */}
        {isActive && liveInterimText && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 animate-spin" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                শোনা যাচ্ছে (Interim Speech):
              </span>
              <p className="text-xs text-emerald-950 font-medium italic mt-0.5">
                "{liveInterimText}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* In-Ear Stream Transcript Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-bengali flex items-center gap-2">
            <Headphones className="w-4 h-4 text-emerald-700" />
            <span>কানে অনূদিত বাক্যাবলী (In-Ear Translation Stream)</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-bold">
              {segments.length}
            </span>
          </h3>

          <span className="text-xs text-slate-400 font-bengali">
            প্রতিটি অনুবাদ সাথে সাথে ইয়ারফোনে শোনানো হচ্ছে
          </span>
        </div>

        {segments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
              <Headphones className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 font-bengali">
              এখনো কোনো কথোপকথন শুরু হয়নি
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-bengali leading-relaxed">
              ইয়ারফোন বা হেডফোন কানে লাগান এবং উপরের <strong>"কানে কানে অনুবাদ শুরু করুন"</strong> বাটন চাপুন। বিদেশী বক্তা কথা বলা মাত্রই বাংলায় আপনার কানে ভেসে উঠবে।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map((seg, idx) => {
              const isCounterpart = seg.speaker === 'counterpart';

              return (
                <div
                  key={seg.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-2xs space-y-3 ${
                    seg.isPlaying
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {seg.timeFormatted}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-bengali ${
                          isCounterpart
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                        }`}
                      >
                        {isCounterpart ? 'বিদেশী বক্তা' : 'আপনি (প্রেসিডেন্ট)'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium font-bengali">
                        ({seg.detectedLang})
                      </span>
                      {seg.sentimentOrTone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bengali">
                          {seg.sentimentOrTone}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Replay into earphone button */}
                      <button
                        type="button"
                        onClick={() => handleReplaySegment(seg)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold font-bengali flex items-center gap-1 transition-all ${
                          seg.isPlaying
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="কানে পুনরায় শুনুন"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {seg.isPlaying ? 'কানে বাজছে...' : 'পুনরায় শুনুন'}
                        </span>
                      </button>

                      {/* Copy Translation */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(seg.translatedText);
                          setCopiedId(seg.id);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                        title="অনুবাদ কপি করুন"
                      >
                        {copiedId === seg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Save to Notebook */}
                      {onSaveToNotebook && (
                        <button
                          type="button"
                          onClick={() => {
                            onSaveToNotebook(
                              `কানে কানে অনুবাদ: ${seg.originalText.slice(0, 30)}...`,
                              `বক্তা (${seg.detectedLang}):\n${seg.originalText}\n\nঅনুবাদ:\n${seg.translatedText}`,
                              'phrase',
                              seg.originalText
                            );
                            setSavedNotebookId(seg.id);
                            setTimeout(() => setSavedNotebookId(null), 1500);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                          title="নোটবুকে সেভ করুন"
                        >
                          {savedNotebookId === seg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual Speech & In-Ear Translation Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Original Foreign Speech */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        মূল উচ্চারণ / মূল বক্তব্য:
                      </span>
                      <p className="text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                        {seg.originalText}
                      </p>
                      {seg.transliteration && (
                        <p className="text-[11px] text-emerald-700 italic pt-1 border-t border-slate-200/60 font-bengali">
                          উচ্চারণ: {seg.transliteration}
                        </p>
                      )}
                    </div>

                    {/* Instant In-Ear Bangla Translation */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider font-bengali flex items-center gap-1">
                          <Headphones className="w-3 h-3 text-emerald-700" />
                          <span>কানে সরাসরি অনূদিত বঙ্গানুবাদ:</span>
                        </span>
                        {seg.audioPlayed && (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>প্লে করা হয়েছে</span>
                          </span>
                        )}
                      </div>
                      <p className="text-slate-900 text-sm sm:text-base font-bold font-bengali leading-relaxed">
                        {seg.translatedText}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={transcriptBottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
