import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Download,
  BookOpen,
  GraduationCap,
  Clock,
  Headphones,
  FileText,
  HelpCircle,
  BookMarked,
  RotateCcw,
  CheckCircle2,
  Activity,
  Radio,
  Zap,
  Loader2,
} from 'lucide-react';
import { blobToBase64, speakText, formatDuration } from '../utils/audioUtils';
import {
  TranslationResult,
  LectureSegment,
  LectureFullSummary,
  LectureTranslationStyle,
  DetectedInClassQuestion,
} from '../types';
import { AutoQuestionAnswerPopup } from './AutoQuestionAnswerPopup';

interface LiveMicTranslatorProps {
  targetLang: string;
  onSaveResult: (result: TranslationResult) => void;
  onSaveToNotebook?: (
    title: string,
    content: string,
    originalText?: string,
    sourceLanguage?: string,
    category?: 'vocabulary' | 'grammar' | 'phrase' | 'study_notes' | 'conversation'
  ) => void;
  onSwitchToEarphoneMode?: () => void;
}

export const LiveMicTranslator: React.FC<LiveMicTranslatorProps> = ({
  targetLang,
  onSaveResult,
  onSaveToNotebook,
  onSwitchToEarphoneMode,
}) => {
  // Operating sub-mode: 'lecture' (continuous) or 'quick' (single utterance)
  const [micMode, setMicMode] = useState<'lecture' | 'quick'>('lecture');

  // Translation style chosen by the university student
  const [translationStyle, setTranslationStyle] =
    useState<LectureTranslationStyle>('simple');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessingChunk, setIsProcessingChunk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Classroom audio preferences
  const [autoSpeakInEarbuds, setAutoSpeakInEarbuds] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Lecture segments stream
  const [segments, setSegments] = useState<LectureSegment[]>([]);

  // Full summary state
  const [fullSummary, setFullSummary] = useState<LectureFullSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Single / Quick mode states
  const [spokenText, setSpokenText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [detectedLang, setDetectedLang] = useState<string>('');
  const [transliteration, setTransliteration] = useState<string>('');

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNotebookId, setSavedNotebookId] = useState<string | null>(null);
  const [isSpeakingText, setIsSpeakingText] = useState<string | null>(null);

  // Auto Classroom Question & Answer state
  const [autoDetectQuestions, setAutoDetectQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<DetectedInClassQuestion | null>(null);
  const [questionHistory, setQuestionHistory] = useState<DetectedInClassQuestion[]>([]);
  const [isQAPopupOpen, setIsQAPopupOpen] = useState(false);

  // Real-time Voice Feedback & Audio Visualizer states
  const [isInitializingMic, setIsInitializingMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [frequencyBars, setFrequencyBars] = useState<number[]>([15, 22, 35, 28, 45, 55, 38, 26, 48, 62, 32, 22, 38, 28, 18, 12]);
  const [hasDetectedVoiceRecently, setHasDetectedVoiceRecently] = useState(false);
  const [liveInterimText, setLiveInterimText] = useState<string>('');

  // MediaRecorder & streaming refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const lastVoiceTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksAccumulator = useRef<Blob[]>([]);
  const segmentIdCounter = useRef(1);
  const lectureBottomRef = useRef<HTMLDivElement | null>(null);
  const currentMimeTypeRef = useRef<string>('audio/webm');
  const isProcessingLock = useRef(false);

  // Audio feedback chime helper
  const playFeedbackChime = (type: 'start' | 'stop') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'start') {
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14);
      } else {
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.14);
      }
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext might be muted or not allowed
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  // Auto-scroll to bottom of lecture transcript when new segment arrives
  useEffect(() => {
    if (autoScroll && lectureBottomRef.current) {
      lectureBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, autoScroll]);

  const stopAllMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current);

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

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setIsInitializingMic(false);
    setAudioLevel(0);
    setHasDetectedVoiceRecently(false);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // START RECORDING (Handles both Lecture and Quick modes)
  // -------------------------------------------------------------
  const handleStartRecording = async () => {
    setError(null);
    setIsInitializingMic(true);
    audioChunksAccumulator.current = [];
    setLiveInterimText('');

    if (micMode === 'quick') {
      setSpokenText('');
      setTranslatedText('');
      setDetectedLang('');
      setTransliteration('');
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'আপনার ব্রাউজারে মাইক্রোফোন সাপোর্ট নেই বা পারমিশন দেওয়া নেই।'
        );
      }

      // Haptic and audio feedback
      playFeedbackChime('start');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Setup Web Audio API Analyser for real-time waveform visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.8;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVisualizer = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            const bars: number[] = [];
            const step = Math.max(1, Math.floor(dataArray.length / 16));
            for (let i = 0; i < 16; i++) {
              const val = dataArray[i * step] || 0;
              bars.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
              sum += val;
            }
            const avg = sum / dataArray.length;
            const normalizedLevel = Math.min(100, Math.round((avg / 128) * 100));
            setAudioLevel(normalizedLevel);
            setFrequencyBars(bars);

            if (normalizedLevel > 6) {
              lastVoiceTimeRef.current = Date.now();
              setHasDetectedVoiceRecently(true);
            } else if (Date.now() - lastVoiceTimeRef.current > 2200) {
              setHasDetectedVoiceRecently(false);
            }

            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          animFrameRef.current = requestAnimationFrame(updateVisualizer);
        }
      } catch (err) {
        console.warn('Web Audio API analyser failed to initialize:', err);
      }

      // Setup SpeechRecognition for instant live transcript feedback
      try {
        const SpeechRec =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              interim += event.results[i][0].transcript;
            }
            if (interim.trim()) {
              setLiveInterimText(interim.trim());
              lastVoiceTimeRef.current = Date.now();
              setHasDetectedVoiceRecently(true);
            }
          };
          rec.onerror = (e: any) => {
            console.warn('SpeechRecognition live event note:', e);
          };
          rec.start();
          speechRecognitionRef.current = rec;
        }
      } catch (err) {
        console.warn('Speech recognition interim stream note:', err);
      }

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      currentMimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksAccumulator.current.push(e.data);

          // If in continuous lecture mode, process available data slice
          if (micMode === 'lecture' && audioChunksAccumulator.current.length > 0) {
            const currentBlob = new Blob(audioChunksAccumulator.current, {
              type: currentMimeTypeRef.current,
            });
            audioChunksAccumulator.current = []; // reset for next chunk
            if (currentBlob.size > 1800) {
              await processLectureChunk(currentBlob);
            }
          }
        }
      };

      recorder.onstop = async () => {
        if (micMode === 'quick' && audioChunksAccumulator.current.length > 0) {
          const fullBlob = new Blob(audioChunksAccumulator.current, {
            type: currentMimeTypeRef.current,
          });
          audioChunksAccumulator.current = [];
          await processQuickAudio(fullBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setIsInitializingMic(false);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // In Lecture Mode: trigger initial rapid chunk at 2.8s, then every 4.2 seconds for ultra-responsive live subtitles
      if (micMode === 'lecture') {
        // First fast chunk
        setTimeout(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'recording'
          ) {
            try {
              mediaRecorderRef.current.requestData();
            } catch (err) {
              console.warn('Initial chunk requestData error:', err);
            }
          }
        }, 2800);

        chunkIntervalRef.current = setInterval(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === 'recording'
          ) {
            try {
              mediaRecorderRef.current.requestData();
            } catch (err) {
              console.warn('requestData error:', err);
            }
          }
        }, 4200);
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsInitializingMic(false);
      setError(
        err.name === 'NotAllowedError'
          ? 'মাইক্রোফোন ব্যবহারের অনুমতি দিন (Microphone Permission Required)। ব্রাউজারের অ্যাড্রেস বারের লক আইকনে ক্লিক করে মাইক্রোফোন চালু করুন।'
          : err.message || 'মাইক্রোফোন সংযোগে ত্রুটি দেখা দিয়েছে।'
      );
      stopAllMedia();
    }
  };

  // Pause / Resume recording during lecture pauses
  const handleTogglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  // Force immediate translation of current speech chunk without waiting for timer
  const handleForceTranslateNow = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      try {
        mediaRecorderRef.current.requestData();
      } catch (err) {
        console.warn('handleForceTranslateNow error:', err);
      }
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    playFeedbackChime('stop');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {
        // ignore
      }
    }
    stopAllMedia();
  };

  // -------------------------------------------------------------
  // CONTINUOUS LECTURE CHUNK PROCESSOR
  // -------------------------------------------------------------
  const processLectureChunk = async (blob: Blob) => {
    if (isProcessingLock.current) return;
    isProcessingLock.current = true;
    setIsProcessingChunk(true);

    try {
      const audioBase64 = await blobToBase64(blob);

      // Pass previous 2 segments as context for academic continuity
      const previousContext = segments
        .slice(-2)
        .map((s) => s.originalText)
        .join('; ');

      const response = await fetch('/api/lecture/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: currentMimeTypeRef.current,
          targetLang,
          translationStyle,
          previousContext,
        }),
      });

      if (!response.ok) {
        throw new Error('সার্ভার থেকে লেকচার অনুবাদের উত্তর পাওয়া যায়নি');
      }

      const data = await response.json();

      // If silence or empty noise, do not add noisy card
      if (!data.isSilence && data.transcription?.trim()) {
        let detectedQ: DetectedInClassQuestion | undefined = undefined;
        if (data.detectedQuestion && data.detectedQuestion.hasQuestion) {
          detectedQ = {
            id: 'q_' + Date.now(),
            source: 'lecture',
            speakerLabel: 'প্রফেসর (Teacher)',
            timestamp: Date.now(),
            timeFormatted: formatTime(recordingSeconds),
            originalQuestion: data.detectedQuestion.questionOriginal || data.transcription,
            detectedLanguage: data.detectedLanguage || 'আরবি / ইংরেজি / উর্দু',
            translatedQuestion: data.detectedQuestion.questionTranslated || data.translation,
            quickAnswer: data.detectedQuestion.quickAnswer,
            detailedAnswer: data.detectedQuestion.detailedAnswer,
            answerInSpeakerLang: data.detectedQuestion.answerInSpeakerLang,
            transliterationSpeakerLang: data.detectedQuestion.transliterationSpeakerLang,
          };

          setCurrentQuestion(detectedQ);
          setQuestionHistory((prev) => [detectedQ!, ...prev]);
          if (autoDetectQuestions) {
            setIsQAPopupOpen(true);
          }
        }

        const newSeg: LectureSegment = {
          id: 'seg_' + Date.now() + '_' + segmentIdCounter.current++,
          timestampSeconds: recordingSeconds,
          timeFormatted: formatTime(recordingSeconds),
          detectedLanguage: data.detectedLanguage || 'অনির্ধারিত',
          originalText: data.transcription,
          translation: data.translation,
          transliteration: data.transliteration,
          keyTerms: data.keyTerms || [],
          detectedQuestion: detectedQ,
        };

        setSegments((prev) => [...prev, newSeg]);

        // Auto earbud readout if student turned it on
        if (autoSpeakInEarbuds && data.translation) {
          speakText(data.translation, 'bn');
        }
      }
    } catch (err: any) {
      console.warn('Lecture chunk error:', err);
    } finally {
      setIsProcessingChunk(false);
      isProcessingLock.current = false;
    }
  };

  // -------------------------------------------------------------
  // QUICK AUDIO CLIP PROCESSOR
  // -------------------------------------------------------------
  const processQuickAudio = async (blob: Blob) => {
    if (blob.size < 1000) {
      setError('অডিও খুব ছোট ছিল। দয়া করে মাইক্রোফোনে স্পষ্টভাবে কথা বলুন।');
      return;
    }

    setIsProcessingChunk(true);
    setError(null);

    try {
      const audioBase64 = await blobToBase64(blob);

      const response = await fetch('/api/translate/live-mic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: currentMimeTypeRef.current,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('মাইক্রোফোন অডিও অনুবাদে সমস্যা হয়েছে।');
      }

      const data = await response.json();
      setSpokenText(data.transcription || '');
      setTranslatedText(data.translation || '');
      setDetectedLang(data.detectedLanguage || '');
      if (data.transliteration) {
        setTransliteration(data.transliteration);
      }

      if (data.transcription && data.translation) {
        onSaveResult({
          id: 'mic_quick_' + Date.now(),
          mode: 'live-voice',
          timestamp: Date.now(),
          sourceLang: data.detectedLanguage || 'Auto',
          targetLang: targetLang === 'bn' ? 'বাংলা' : targetLang,
          detectedLang: data.detectedLanguage,
          originalText: data.transcription,
          translatedText: data.translation,
          transliteration: data.transliteration,
          audioDuration: recordingSeconds,
        });
      }
    } catch (err: any) {
      setError(err.message || 'অনুবাদ সম্পন্ন করা যায়নি।');
    } finally {
      setIsProcessingChunk(false);
    }
  };

  // -------------------------------------------------------------
  // FULL LECTURE SUMMARY & EXAM PREP GENERATOR
  // -------------------------------------------------------------
  const handleGenerateFullSummary = async () => {
    if (segments.length === 0) {
      setError('সারাংশ তৈরির জন্য অন্তত একটি লেকচার অংশ থাকা প্রয়োজন।');
      return;
    }

    setIsGeneratingSummary(true);
    setError(null);

    try {
      const response = await fetch('/api/lecture/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error('লেকচার সারসংক্ষেপ তৈরি করতে সমস্যা হয়েছে');
      }

      const summaryData: LectureFullSummary = await response.json();
      setFullSummary(summaryData);

      // Also save to app history
      onSaveResult({
        id: 'lecture_summary_' + Date.now(),
        mode: 'live-voice',
        timestamp: Date.now(),
        sourceLang: 'Multilingual Lecture (Arabic/English/Urdu)',
        targetLang: 'বাংলা',
        originalText: `[বিশ্ববিদ্যালয় লেকচার নোট]: ${summaryData.lectureTitle}`,
        translatedText: summaryData.executiveSummary,
        keyPoints: summaryData.keyConcepts,
        audioDuration: recordingSeconds,
      });
    } catch (err: any) {
      setError(err.message || 'সারাংশ তৈরি করা সম্ভব হয়নি');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // -------------------------------------------------------------
  // SIMULATION DEMOS FOR THE STUDENT (ARABIC / ENGLISH / URDU CODE-SWITCHING)
  // -------------------------------------------------------------
  const handleLoadDemoLecture = (
    demoType: 'arabic_academic' | 'code_switch_mixed' | 'urdu_clarification'
  ) => {
    let mockSegments: LectureSegment[] = [];

    if (demoType === 'arabic_academic') {
      mockSegments = [
        {
          id: 'demo_1',
          timestampSeconds: 5,
          timeFormatted: '00:05',
          detectedLanguage: 'আরবি (Arabic - الفصحى)',
          originalText:
            'بسم الله الرحمن الرحيم، اليوم سنتحدث عن مفهوم العدالة التشريعية وأهمية المقاصد العامة في الفقه المقارن.',
          transliteration:
            'বিসমিল্লাহির রাহমানির রাহিম, আল-ইয়াওমা সানা-তাহাদ্দাসু আন মাফহূমিল আদালাত আত-তাশরিইয়্যাহ...',
          translation:
            'পরম করুণাময় আল্লাহর নামে শুরু করছি, আজ আমরা তুলনামূলক আইনশাস্ত্রে আইনি ন্যায়বিচারের ধারণা এবং সার্বিক উদ্দেশ্যের (মাকাসিদ) গুরুত্ব নিয়ে আলোচনা করব।',
          keyTerms: [
            { term: 'العدالة التشريعية', meaning: 'আইনি ন্যায়বিচার' },
            { term: 'المقاصد العامة', meaning: 'সার্বিক উদ্দেশ্য' },
          ],
        },
        {
          id: 'demo_2',
          timestampSeconds: 15,
          timeFormatted: '00:15',
          detectedLanguage: 'আরবি (Arabic)',
          originalText:
            'الهدف الأساسي هو تحقيق المصلحة ودرء المفسدة، وهذا هو جوهر الشريعة في كل زمان ومكان.',
          transliteration:
            'আল-হাদাফুল আসাসিয়্যু হুয়া তাহকীকুল মাসলাহাহ ওয়া দারউল মাফসাদ্দাহ...',
          translation:
            'মূল লক্ষ্য হলো কল্যাণ সাধন করা এবং অপকার বা অনিষ্ট প্রতিরোধ করা, আর এটাই সব যুগ ও স্থানের জন্য আইনের মূল নির্যাস।',
          keyTerms: [
            { term: 'تحقيق المصلحة', meaning: 'জনকল্যাণ নিশ্চিতকরণ' },
            { term: 'درء المفسدة', meaning: 'ক্ষতি বা অনিষ্ট দূরীকরণ' },
          ],
        },
      ];
    } else if (demoType === 'code_switch_mixed') {
      mockSegments = [
        {
          id: 'demo_3',
          timestampSeconds: 5,
          timeFormatted: '00:05',
          detectedLanguage: 'আরবি + ইংরেজি (Mixed Code-Switching)',
          originalText:
            'السلام عليكم جميعاً. Today we will explore how algorithmic governance influences judicial decisions, أو ما نسميه بالحوكمة الرقمية.',
          transliteration:
            'আসসালামু আলাইকুম জামিআন... আও মা নুসাম্মীহি বিল-হাওকামাহ আর-রকমিয়্যাহ',
          translation:
            'সবার উপর শান্তি বর্ষিত হোক। আজ আমরা দেখব কীভাবে অ্যালগরিদমিক গভর্ন্যান্স বিচারিক সিদ্ধান্তকে প্রভাবিত করে, যাকে আমরা ডিজিটাল শাসনব্যবস্থা বলে থাকি।',
          keyTerms: [
            { term: 'Algorithmic Governance', meaning: 'অ্যালগরিদম নির্ভর শাসন' },
            { term: 'الحوكمة الرقمية', meaning: 'ডিজিটাল গভর্ন্যান্স' },
          ],
        },
        {
          id: 'demo_4',
          timestampSeconds: 16,
          timeFormatted: '00:16',
          detectedLanguage: 'ইংরেজি + আরবি (English with Arabic terms)',
          originalText:
            'When evaluating empirical data, we must observe the principle of الإتقان (perfection and precision) in our methodological framework.',
          transliteration:
            'হোয়েন ইভ্যালুয়েটিং এম্পিরিক্যাল ডেটা... আল-ইতকান ইন আওয়ার মেথডোলজিক্যাল ফ্রেমওয়ার্ক',
          translation:
            'বাস্তব তথ্য উপাত্ত মূল্যায়নের সময়, আমাদের অবশ্যই গবেষণার কার্যপদ্ধতিতে "আল-ইতকান" বা নিখুঁত যথার্থতার নীতি অনুসরণ করতে হবে।',
          keyTerms: [
            { term: 'Empirical Data', meaning: 'অভিজ্ঞতাপ্রসূত বাস্তব উপাত্ত' },
            { term: 'الإتقان', meaning: 'নিখুঁত যথার্থতা ও দক্ষতা' },
          ],
        },
      ];
    } else {
      mockSegments = [
        {
          id: 'demo_5',
          timestampSeconds: 8,
          timeFormatted: '00:08',
          detectedLanguage: 'উর্দু + আরবি (Urdu with Arabic Terminology)',
          originalText:
            'دیکھیے طلباء کرام، اس قیاس کا بنیادی مقصد یہ ہے کہ جب نیا مسئلہ سامنے آئے تو اصل حکم سے تطبیق کیسے دی جائے۔',
          transliteration:
            'দেখিয়ে তুলাবা-এ কেরাম, ইস কিয়াসের বুনিয়াদী মাকসাদ ইয়ে হ্যায় কে জব নয়া মাসআলা সামনে আয়ে...',
          translation:
            'প্রিয় ছাত্রছাত্রীরা লক্ষ্য করুন, এই তুলনামূলক বিচারপদ্ধতির (কিয়াস) মূল উদ্দেশ্য হলো যখন কোনো নতুন বাস্তব পরিস্থিতি তৈরি হবে, তখন মূল বিধানের সাথে কীভাবে তার সামঞ্জস্য বিধান করা যায়।',
          keyTerms: [
            { term: 'قیاس (Qiyas)', meaning: 'সাদৃশ্যমূলক যৌক্তিক বিচার' },
            { term: 'تطبیق', meaning: 'প্রয়োগ বা সামঞ্জস্যবিধান' },
          ],
        },
        {
          id: 'demo_6',
          timestampSeconds: 20,
          timeFormatted: '00:20',
          detectedLanguage: 'উর্দু (Urdu)',
          originalText:
            'اس لیے آپ حضرات بنیادی اصولوں کو اچھی طرح ذہن نشین فرمائیں تاکہ امتحان میں کوئی الجھن نہ رہے۔',
          transliteration:
            'ইস লিয়ে আপ হাজরাত বুনিয়াদী উসুলোঁ কো আচ্ছি তারাহ জেহেন-নশীন ফরমায়েঁ...',
          translation:
            'তাই আপনারা মূলনীতিগুলো খুব ভালো করে মনের মধ্যে গেঁথে নিন, যাতে পরীক্ষায় কোনো বিভ্রান্তি বা দ্বিধাদ্বন্দ্ব না থাকে।',
          keyTerms: [{ term: 'ذہن نشین', meaning: 'স্মরণ রাখা বা হৃদয়ঙ্গম করা' }],
        },
      ];
    }

    const demoQuestion: DetectedInClassQuestion = {
      id: 'demo_q_1',
      source: 'lecture',
      speakerLabel: 'প্রফেসর (Teacher)',
      timestamp: Date.now(),
      timeFormatted: '00:25',
      originalQuestion:
        demoType === 'arabic_academic'
          ? 'من منكم يستطيع أن يوضح الفرق الجوهري بين المصلحة المرسلة والقياس؟'
          : demoType === 'code_switch_mixed'
          ? 'Can anyone explain how algorithmic decisions differ from human discretionary judgment in administrative law?'
          : 'کیا کوئی طالب علم واضح کر سکتا ہے کہ قیاس اور استحسان میں بنیادی فرق کیا ہے؟',
      detectedLanguage:
        demoType === 'arabic_academic'
          ? 'আরবি (Arabic)'
          : demoType === 'code_switch_mixed'
          ? 'ইংরেজি (English)'
          : 'উর্দু (Urdu)',
      translatedQuestion:
        demoType === 'arabic_academic'
          ? 'তোমাদের মধ্য থেকে কে মাসলাহা মুরসালাহ এবং কিয়াসের মধ্যকার মৌলিক পার্থক্যটি ব্যাখ্যা করতে পারবে?'
          : demoType === 'code_switch_mixed'
          ? 'কে ব্যাখ্যা করতে পারবে কীভাবে প্রশাসনিক আইনে অ্যালগরিদমিক সিদ্ধান্ত মানুষের নিজস্ব বিবেচনাবোধের চেয়ে আলাদা?'
          : 'কোনো ছাত্র কি স্পষ্ট করতে পারবে যে কিয়াস ও ইসতিহসানের মধ্যে মৌলিক পার্থক্য কী?',
      quickAnswer:
        demoType === 'arabic_academic'
          ? 'কিয়াস হলো পূর্বের মূল টেক্সটের সুনির্দিষ্ট ইল্লতের ভিত্তিতে তুলনা, আর মাসলাহাহ মুরসালাহ হলো সরাসরি নির্দিষ্ট টেক্সট ছাড়াই বৃহত্তর সার্বিক জনকল্যাণ নিশ্চিতকরণের সিদ্ধান্ত।'
          : demoType === 'code_switch_mixed'
          ? 'অ্যালগরিদম নির্দিষ্ট সংরক্ষিত ডেটা ও রুলসে আবদ্ধ থাকে, কিন্তু মানুষের বিচারিক বিবেচনা প্রেক্ষাপট, সহানুভূতি ও ন্যায়পরায়ণতার বাস্তব পরিস্থিতি পরিমাপ করতে পারে।'
          : 'কিয়াসে প্রকাশিত সাদৃশ্যের ওপর নির্ভর করা হয়, আর ইসতিহসানে অধিকতর শক্তিশালী ও কল্যাণকর গোপন যুক্তিকে প্রাধান্য দেওয়া হয়।',
      detailedAnswer:
        demoType === 'arabic_academic'
          ? '১. কিয়াসের ভিত্তি: কিয়াসে একটি সুনির্দিষ্ট মূল ভিত্তি (আসল), শাখা (ফর) এবং উভয়ের মধ্যে কার্যকর কারণ (ইল্লাত) থাকতে হয়।\n২. মাসলাহা মুরসালাহের ভিত্তি: এতে কোনো একক টেক্সটের সরাসরি আদেশ বা নিষেধ থাকে না, বরং শরীয়তের সার্বিক উদ্দেশ্য (মাকাসিদ) ও মানুষের বৃহত্তর স্বার্থ ও ক্ষতি প্রতিরোধের নীতিতে এটি প্রতিষ্ঠিত হয়।\n৩. প্রয়োগক্ষেত্র: আধুনিক পরিবর্তনশীল প্রশাসনিক ও অর্থনৈতিক সমস্যা সমাধানে মাসলাহা মুরসালাহের পরিধি অধিকতর বিস্তৃত।'
          : demoType === 'code_switch_mixed'
          ? '১. নিয়মভিত্তিক বনাম ন্যায়পরায়ণতা: অ্যালগরিদম পূর্বনির্ধারিত প্যাটার্নে চলে, ফলে বিশেষ মানবিক বা ব্যতিক্রমী দিক বাদ পড়তে পারে।\n২. জবাবদিহিতা ও স্বচ্ছতা: প্রশাসনিক আইনে কারণ দর্শানোর নীতি (Reasoned Decision) আবশ্যক, যা ব্ল্যাক-বক্স এআই মডেলে ব্যাখ্যা করা দুরূহ।'
          : '১. কিয়াস হলো স্পষ্ট সাদৃশ্যের মাধ্যমে বিধান বের করা।\n২. ইসতিহসান হলো বিশেষ কল্যাণ বা সংকীর্ণতা দূরীকরণে সাধারণ কিয়াস ত্যাগ করে শক্তিশালী কোনো বিকল্প গ্রহণ করা।',
      answerInSpeakerLang:
        demoType === 'arabic_academic'
          ? 'القياس يستند إلى أصل منصوص عليه وعلة جامعة، أما المصلحة المرسلة فتعتمد على جلب المنفعة ودفع المفسدة وفق مقاصد الشريعة العامة دون نص خاص بخصوصها.'
          : demoType === 'code_switch_mixed'
          ? 'Algorithmic governance relies strictly on pre-trained data patterns, whereas human judicial discretion evaluates contextual nuance, equity, and individualized circumstances.'
          : 'قیاس میں ظاہر علت پر عمل کیا جاتا ہے جبکہ استحسان میں مصلحت اور وسعت کی خاطر قیاسِ جلی کو چھوڑ کر قیاسِ خفی یا دلیلِ قوی کو اختیار کیا جاتا ہے۔',
      transliterationSpeakerLang:
        demoType === 'arabic_academic'
          ? 'আল-কিয়াসু য়াসতানিদু ইলা আসলিন মানসূসিন আলাইহি ওয়া ইল্লাতিন জামিআহ...'
          : demoType === 'code_switch_mixed'
          ? 'অ্যালগরিদমিক গভর্ন্যান্স রিলাইজ স্ট্রিক্টলি অন প্রি-ট্রেইন্ড ডেটা প্যাটার্নস...'
          : 'কিয়াস মে জাহির ইল্লাত পর আমল কিয়া জাতা হ্যায় যাবকে ইসতিহসান মে মাসলাহত কি খাতির...',
      keyConcepts: ['মাসলাহা মুরসালাহ', 'কিয়াস', 'আইনি দর্শন'],
    };

    mockSegments.push({
      id: 'demo_q_seg',
      timestampSeconds: 25,
      timeFormatted: '00:25',
      detectedLanguage: demoQuestion.detectedLanguage,
      originalText: demoQuestion.originalQuestion,
      translation: `[প্রফেসরের প্রশ্ন]: ${demoQuestion.translatedQuestion}`,
      transliteration: demoQuestion.transliterationSpeakerLang,
      keyTerms: [{ term: 'Question / প্রশ্ন', meaning: 'ক্লাসরুমে প্রফেসরের জিজ্ঞাসা' }],
      detectedQuestion: demoQuestion,
    });

    setSegments(mockSegments);
    setCurrentQuestion(demoQuestion);
    setQuestionHistory([demoQuestion]);
    if (autoDetectQuestions) {
      setIsQAPopupOpen(true);
    }
    setError(null);
  };

  // -------------------------------------------------------------
  // ACTION HANDLERS
  // -------------------------------------------------------------
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = async (text: string, lang: string, id: string) => {
    setIsSpeakingText(id);
    await speakText(text, lang);
    setIsSpeakingText(null);
  };

  const handleSaveSegmentToNotebook = (seg: LectureSegment) => {
    if (!onSaveToNotebook) return;
    const title = `ক্লাস লেকচার: [${seg.timeFormatted}] ${seg.detectedLanguage}`;
    const content = `মূল ভাষা: ${seg.originalText}\nউচ্চারণ: ${seg.transliteration || 'প্রযোজ্য নয়'}\nঅনুবাদ: ${seg.translation}`;
    onSaveToNotebook(title, content, seg.originalText, seg.detectedLanguage, 'study_notes');
    setSavedNotebookId(seg.id);
    setTimeout(() => setSavedNotebookId(null), 2500);
  };

  const handleSaveFullSummaryToNotebook = () => {
    if (!fullSummary || !onSaveToNotebook) return;
    const title = `🎓 লেকচার নোটস: ${fullSummary.lectureTitle}`;
    const content = `সারসংক্ষেপ:\n${fullSummary.executiveSummary}\n\nমূল তত্ত্বসমূহ:\n${fullSummary.keyConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nপরিভাষা ব্যাংক:\n${fullSummary.vocabularyBank.map((v) => `• ${v.term} (${v.originalLang}): ${v.bengaliMeaning} - ${v.contextNote}`).join('\n')}\n\nপরীক্ষার প্রশ্ন:\n${fullSummary.studyQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    onSaveToNotebook(title, content, fullSummary.lectureTitle, 'Arabic/English/Urdu', 'study_notes');
    setSavedNotebookId('full_summary');
    setTimeout(() => setSavedNotebookId(null), 2500);
  };

  const handleDownloadTranscript = () => {
    if (segments.length === 0) return;
    const header = `=======================================================\nবিশ্ববিদ্যালয় ক্লাস লেকচার প্রতিলিপি ও বাংলা অনুবাদ\nতারিখ: ${new Date().toLocaleDateString('bn-BD')}\nমোট সময়: ${formatTime(recordingSeconds)}\nঅনুবাদ স্টাইল: ${
      translationStyle === 'academic'
        ? 'একাডেমিক বাংলা'
        : translationStyle === 'terminology'
        ? 'শব্দার্থ ও মূল টার্মসহ'
        : translationStyle === 'bullet'
        ? 'সংক্ষিপ্ত বুলেট পয়েন্ট'
        : 'সহজ ও সাবলীল বাংলা'
    }\n=======================================================\n\n`;

    const body = segments
      .map(
        (s, idx) =>
          `[${s.timeFormatted}] #${idx + 1} (${s.detectedLanguage})\nমূল বক্তব্য:\n${s.originalText}\n${
            s.transliteration ? `উচ্চারণ: ${s.transliteration}\n` : ''
          }বাংলা অনুবাদ:\n${s.translation}\n-------------------------------------------------------`
      )
      .join('\n\n');

    let summaryBlock = '';
    if (fullSummary) {
      summaryBlock = `\n\n=======================================================\nAI লেকচার নোটস ও মূল পয়েন্ট\nশিরোনাম: ${fullSummary.lectureTitle}\n\nসারসংক্ষেপ:\n${fullSummary.executiveSummary}\n\nমূল কনসেপ্ট:\n${fullSummary.keyConcepts.join('\n')}\n\nসম্ভাব্য পরীক্ষার প্রশ্ন:\n${fullSummary.studyQuestions.join('\n')}\n=======================================================`;
    }

    const blob = new Blob([header + body + summaryBlock], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `university_lecture_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isArabicScript = (text: string) => /[\u0600-\u06FF]/.test(text);

  return (
    <div className="space-y-6">
      {/* Top Banner: University Student Lecture Assistant Indicator */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold backdrop-blur border border-white/20">
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span>বিশ্ববিদ্যালয় ছাত্র স্পেশাল • লাইভ প্রফেসর লেকচার মোড</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-bengali tracking-tight">
              প্রফেসরের আরবি, ইংরেজি ও উর্দু লেকচারের তাৎক্ষণিক বাংলা অনুবাদ
            </h2>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex sm:self-start lg:self-center bg-black/20 p-1.5 rounded-2xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setMicMode('lecture')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                micMode === 'lecture'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>লাইভ প্রফেসর লেকচার</span>
            </button>
            <button
              type="button"
              onClick={() => setMicMode('quick')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                micMode === 'quick'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>একক বাক্য অনুবাদ</span>
            </button>
            {onSwitchToEarphoneMode && (
              <button
                type="button"
                onClick={onSwitchToEarphoneMode}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all shadow-xs"
                title="প্রেসিডেন্ট ও ভিআইপির মতো কানে কানে দোভাষী মোডে যান"
              >
                <Headphones className="w-4 h-4" />
                <span>কানে কানে দোভাষী (ইয়ারফোন)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Microphone Operation Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        {/* Pulsing indicator when recording */}
        {isRecording && !isPaused && (
          <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
        )}

        {/* Translation Style Selector: "অনুবাদ হবে আমি যেভাবে চাইবো" */}
        {micMode === 'lecture' && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-bengali">
                  অনুবাদের ধরন নির্ধারণ করুন (আপনি যেভাবে চাইবেন):
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-bengali">
                প্রফেসরের ধরন ও আপনার পড়াশোনার প্রয়োজন অনুযায়ী বেছে নিন
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setTranslationStyle('simple')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  translationStyle === 'simple'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <p className="text-xs font-bold font-bengali">১. সহজ ও প্রাঞ্জল বাংলা</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    translationStyle === 'simple'
                      ? 'text-emerald-100'
                      : 'text-slate-500'
                  }`}
                >
                  দৈনন্দিন কথায় চটপট বোঝার জন্য
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTranslationStyle('academic')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  translationStyle === 'academic'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <p className="text-xs font-bold font-bengali">২. বিশ্ববিদ্যালয় একাডেমিক</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    translationStyle === 'academic'
                      ? 'text-emerald-100'
                      : 'text-slate-500'
                  }`}
                >
                  তাত্ত্বিক ও প্রাতিষ্ঠানিক মানসম্পন্ন
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTranslationStyle('terminology')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  translationStyle === 'terminology'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <p className="text-xs font-bold font-bengali">৩. শব্দার্থ ও মূল টার্মসহ</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    translationStyle === 'terminology'
                      ? 'text-emerald-100'
                      : 'text-slate-500'
                  }`}
                >
                  আরবি/উর্দু পরিভাষার অর্থ বন্ধনীতে
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTranslationStyle('bullet')}
                className={`p-3 rounded-xl text-left border transition-all ${
                  translationStyle === 'bullet'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
              >
                <p className="text-xs font-bold font-bengali">৪. সংক্ষিপ্ত বুলেট কি-নোট</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    translationStyle === 'bullet'
                      ? 'text-emerald-100'
                      : 'text-slate-500'
                  }`}
                >
                  পরীক্ষার আগে দ্রুত পড়ার উপযোগী
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Big Interactive Mic Action Trigger with Real-Time Audio Feedback */}
        <div className="flex flex-col items-center text-center">
          <div className="relative my-3">
            {isRecording && !isPaused && (
              <>
                <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping" />
                <div className="absolute -inset-8 rounded-full bg-red-500/10 animate-pulse" />
              </>
            )}

            <button
              id="live-microphone-toggle-button"
              type="button"
              disabled={isInitializingMic}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer ${
                isInitializingMic
                  ? 'bg-amber-600 text-white ring-8 ring-amber-100 cursor-wait'
                  : isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white ring-8 ring-red-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-8 ring-emerald-100'
              }`}
            >
              {isInitializingMic ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-[11px] font-bold mt-1 font-bengali">
                    চালু হচ্ছে...
                  </span>
                </>
              ) : isRecording ? (
                <>
                  <Square className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
                  <span className="text-[11px] font-bold mt-1 tracking-wider uppercase">
                    লেকচার শেষ
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-9 h-9 sm:w-11 sm:h-11" />
                  <span className="text-[11px] font-bold mt-1 font-bengali">
                    {micMode === 'lecture' ? 'লেকচার শুনুন' : 'কথা বলুন'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Status, Duration, Audio Visualizer and Controls during Lecture */}
          <div className="mt-2 space-y-3 w-full max-w-md flex flex-col items-center">
            {isRecording ? (
              <div className="flex flex-col items-center gap-3 w-full">
                {/* 1. Real-Time Dynamic Sound Equalizer Waveform */}
                <div className="w-full bg-slate-900/95 backdrop-blur-md rounded-2xl p-3.5 shadow-md border border-slate-800 flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full text-[11px] px-1 text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                      লাইভ মাইক্রোফোন স্পেকট্রাম
                    </span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-bold">
                      ভলিউম: {audioLevel}%
                    </span>
                  </div>

                  {/* 16 Bouncing Equalizer Bars */}
                  <div className="flex items-end justify-center gap-1.5 h-12 w-full pt-1 pb-0.5">
                    {frequencyBars.map((heightPercent, idx) => (
                      <div
                        key={idx}
                        className={`w-2 sm:w-2.5 rounded-full transition-all duration-75 ${
                          hasDetectedVoiceRecently || heightPercent > 35
                            ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 shadow-xs shadow-emerald-500/40'
                            : 'bg-slate-700/80'
                        }`}
                        style={{ height: `${Math.max(12, heightPercent)}%` }}
                      />
                    ))}
                  </div>

                  {/* Audio Activity Progress Line */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-100 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, audioLevel * 1.5))}%` }}
                    />
                  </div>
                </div>

                {/* 2. Voice Activity Detection Pill */}
                {hasDetectedVoiceRecently || audioLevel > 6 ? (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>🟢 প্রফেসরের কণ্ঠস্বর সক্রিয়ভাবে রেকর্ড ও গ্রহণ করা হচ্ছে</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span>🟡 মাইক্রোফোন সম্পূর্ণ প্রস্তুত • প্রফেসর কথা বললেই স্বয়ংক্রিয় অনুবাদ শুরু হবে</span>
                  </div>
                )}

                {/* 3. Live Interim Speech Bubble (Immediate Speech Feedback) */}
                {liveInterimText && (
                  <div className="w-full bg-white border border-emerald-200/90 rounded-2xl p-3 text-left shadow-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                      <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                      <span>লাইভ শোনা যাচ্ছে:</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium mt-1 italic font-bengali">
                      "{liveInterimText}"
                    </p>
                  </div>
                )}

                {/* 4. Duration, Pause/Resume, and Force Translate Now Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
                  <div className="flex items-center gap-2 text-red-600 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-full border border-red-200 shadow-2xs">
                    <span
                      className={`w-2 h-2 rounded-full bg-red-600 ${
                        isPaused ? '' : 'animate-ping'
                      }`}
                    />
                    <span>
                      {isPaused ? 'লেকচার সাময়িক স্থগিত' : 'রেকর্ডিং চলছে'}:{' '}
                      {formatTime(recordingSeconds)}
                    </span>
                  </div>

                  {micMode === 'lecture' && (
                    <>
                      <button
                        type="button"
                        onClick={handleTogglePause}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                        title={isPaused ? 'পুনরায় চালু করুন' : 'সাময়িক বিরতি নিন'}
                      >
                        {isPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                            <span>চালু করুন</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current text-amber-600" />
                            <span>বিরতি</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleForceTranslateNow}
                        disabled={isProcessingChunk}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                        title="টাইমারের অপেক্ষা না করে এই মুহূর্তের কথা এখনই অনুবাদ করুন"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>এখনই অনুবাদ করুন</span>
                      </button>
                    </>
                  )}
                </div>

                {isProcessingChunk && (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>প্রফেসরের সাম্প্রতিক বাক্য বিশ্লেষণ ও অনুবাদ হচ্ছে...</span>
                  </div>
                )}

                <p className="text-xs text-slate-500 font-bengali text-center">
                  {micMode === 'lecture'
                    ? 'প্রফেসর একটানা কথা বললেও প্রতি ৫ সেকেন্ডে স্বয়ংক্রিয়ভাবে নিচে বাংলা সাবটাইটেল ও লেকচার নোট যুক্ত হতে থাকবে।'
                    : 'কথা বলা শেষ হলে লাল বাটনে ক্লিক করে অনুবাদ সম্পন্ন করুন।'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-800 font-bengali">
                  {micMode === 'lecture'
                    ? 'লেকচার শুরুর আগে সবুজ বাটনে চাপুন'
                    : 'কথা বলার জন্য মাইক্রোফোন অন করুন'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-bengali">
                  চাপ দেওয়ার সাথে সাথে মাইক্রোফোন লাইভ সাউন্ড ওয়েভফর্ম ও স্পেকট্রাম ফিডব্যাক প্রদর্শন করবে
                </p>
              </div>
            )}
          </div>

          {/* Classroom Audio Preferences for Students */}
          {micMode === 'lecture' && (
            <div className="mt-5 pt-4 border-t border-slate-100 w-full flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoSpeakInEarbuds(!autoSpeakInEarbuds)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    autoSpeakInEarbuds
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {autoSpeakInEarbuds ? (
                    <>
                      <Headphones className="w-3.5 h-3.5 text-emerald-700" />
                      <span>ইয়ারফোন মোড: চালু (কানে বাংলায় শোনাচ্ছে)</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                      <span>নীরব ক্লাসরুম মোড (শব্দহীন সাবটাইটেল)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    autoScroll
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>অটো-স্ক্রোল: {autoScroll ? 'অন' : 'অফ'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoDetectQuestions(!autoDetectQuestions)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    autoDetectQuestions
                      ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                  title="প্রফেসর ক্লাসে কোনো প্রশ্ন করলে স্বয়ংক্রিয়ভাবে পপআপ ওপেন হয়ে উত্তর বানিয়ে দেবে"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>অটো প্রশ্ন-উত্তর পপআপ: {autoDetectQuestions ? 'চালু' : 'বন্ধ'}</span>
                </button>
              </div>

              {/* Quick Lecture Simulation Demos */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bengali text-[11px]">
                  পরীক্ষা করতে ডেমো লেকচার:
                </span>
                <button
                  type="button"
                  onClick={() => handleLoadDemoLecture('arabic_academic')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  🇸🇦 আরবি লেকচার
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoLecture('code_switch_mixed')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  🌐 আরবি + ইংরেজি মিশ্র
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoLecture('urdu_clarification')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  🇵🇰 উর্দু লেকচার
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 max-w-lg text-left">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">ত্রুটি</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODE 1: CONTINUOUS LECTURE STREAM FEED (LIVE SUBTITLES) */}
      {/* ============================================================= */}
      {micMode === 'lecture' && (
        <div className="space-y-4">
          {/* Lecture Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800 font-bengali">
                লাইভ লেকচার সাবটাইটেল স্ট্রিম ({segments.length}টি অংশ অনূদিত)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {questionHistory.length > 0 && (
                <button
                  type="button"
                  id="open-question-history-popup-btn"
                  onClick={() => {
                    setCurrentQuestion(questionHistory[0]);
                    setIsQAPopupOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-xs transition-all animate-pulse"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>প্রফেসরের প্রশ্ন ও উত্তর ({questionHistory.length})</span>
                </button>
              )}

              {segments.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleGenerateFullSummary}
                    disabled={isGeneratingSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isGeneratingSummary ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>AI লেকচার নোটস ও পরীক্ষার প্রশ্ন</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTranscript}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ডাউনলোড লেকচার শিট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSegments([]);
                      setFullSummary(null);
                      setRecordingSeconds(0);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 text-xs transition-colors"
                    title="ক্লিয়ার করুন"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>রিসেট</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Full AI Lecture Summary Card (if generated) */}
          {fullSummary && (
            <div className="bg-linear-to-br from-emerald-50 via-teal-50 to-white rounded-3xl p-6 border-2 border-emerald-500/30 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      AI তৈরি বিশ্ববিদ্যালয় লেকচার শিট
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-bengali">
                      {fullSummary.lectureTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveFullSummaryToNotebook}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    {savedNotebookId === 'full_summary' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>নোটবুকে সেভ হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <BookMarked className="w-3.5 h-3.5" />
                        <span>পুরো নোটবুকে সেভ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-bengali flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  সারসংক্ষেপ (Executive Summary)
                </h4>
                <p className="text-sm text-slate-700 font-bengali leading-relaxed">
                  {fullSummary.executiveSummary}
                </p>
              </div>

              {/* Key Academic Concepts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-bengali flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    গুরুত্বপূর্ণ তাত্ত্বিক কনসেপ্টসমূহ
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-bengali">
                    {fullSummary.keyConcepts.map((concept, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exam Review Questions */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider font-bengali flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    পরীক্ষার সম্ভাব্য প্রশ্ন ও প্রস্তুতি
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700 font-bengali">
                    {fullSummary.studyQuestions.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Vocabulary Glossary Bank */}
              {fullSummary.vocabularyBank.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-bengali flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    প্রফেসরের ব্যবহৃত কঠিন পরিভাষা ব্যাংক (Glossary)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {fullSummary.vocabularyBank.map((term, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-arabic text-sm">
                            {term.term}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                            {term.originalLang}
                          </span>
                        </div>
                        <p className="text-emerald-800 font-semibold font-bengali">
                          {term.bengaliMeaning}
                        </p>
                        <p className="text-slate-500 text-[11px] font-bengali">
                          {term.contextNote}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state when no lecture segments yet */}
          {segments.length === 0 && (
            <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 font-bengali">
                লেকচার শুরু করতে উপরের সবুজ মাইক্রোফোন বাটনে চাপুন
              </h4>
              <p className="text-xs text-slate-500 font-bengali max-w-md mx-auto leading-relaxed">
                প্রফেসর যখনই কথা বলা শুরু করবেন, তার আরবি, ইংরেজি বা উর্দু কথাগুলো লাইভ সাবটাইটেল
                হিসেবে এখানে ভেসে উঠবে এবং সাথে সাথে আপনার নির্বাচিত স্টাইলে সহজ বাংলায় অনুবাদ হবে।
              </p>
            </div>
          )}

          {/* Subtitle Feed List */}
          <div className="space-y-3">
            {segments.map((seg, index) => {
              const isArabic = isArabicScript(seg.originalText);
              return (
                <div
                  key={seg.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row gap-4 justify-between"
                >
                  {/* Left Column: Spoken Original Speech with Language Badge */}
                  <div className="flex-1 space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          {seg.timeFormatted}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                          {seg.detectedLanguage}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleSpeak(
                              seg.originalText,
                              isArabic ? 'ar' : 'en',
                              'orig_' + seg.id
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="মূল উচ্চারণ শুনুন"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(seg.originalText, 'orig_' + seg.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="কপি করুন"
                        >
                          {copiedId === 'orig_' + seg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Original Spoken Text */}
                    <p
                      className={`text-slate-900 leading-relaxed font-medium select-text ${
                        isArabic
                          ? 'font-arabic text-right text-lg sm:text-xl text-emerald-950'
                          : 'text-sm sm:text-base'
                      }`}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    >
                      {seg.originalText}
                    </p>

                    {/* Phonetic Pronunciation (for Arabic/Urdu) */}
                    {seg.transliteration && (
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <span className="font-semibold text-slate-500">বাংলা উচ্চারণ: </span>
                        {seg.transliteration}
                      </div>
                    )}

                    {/* Key Terms tags */}
                    {seg.keyTerms && seg.keyTerms.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {seg.keyTerms.map((term, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            <span className="font-bold">{term.term}</span>: {term.meaning}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Bengali Translation */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between pb-1.5">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-bengali flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          বাংলা অনুবাদ
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleSpeak(seg.translation, 'bn', 'trans_' + seg.id)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            title="বাংলায় শুনুন"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>শুনুন</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(seg.translation, 'trans_' + seg.id)
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="অনুবাদ কপি করুন"
                          >
                            {copiedId === 'trans_' + seg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-800 leading-relaxed text-sm sm:text-base font-bengali select-text">
                        {seg.translation}
                      </p>

                      {seg.detectedQuestion && (
                        <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-amber-900">
                                🚨 প্রফেসরের প্রশ্ন শনাক্ত হয়েছে!
                              </p>
                              <p className="text-[11px] text-amber-700 font-medium">
                                AI হাত তুলে বলার তাত্ক্ষণিক ও ক্লাসরুম একাডেমিক উত্তর প্রস্তুত করেছে
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentQuestion(seg.detectedQuestion!);
                              setIsQAPopupOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-xs flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>উত্তর দেখুন</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: Save to Notebook */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="text-[11px] text-slate-400">অংশ #{index + 1}</span>

                      {onSaveToNotebook && (
                        <button
                          type="button"
                          onClick={() => handleSaveSegmentToNotebook(seg)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                        >
                          {savedNotebookId === seg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">
                                নোটবুকে যুক্ত হয়েছে
                              </span>
                            </>
                          ) : (
                            <>
                              <BookOpen className="w-3 h-3" />
                              <span>নোটবুকে সেভ করুন</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Scroll bottom anchor */}
            <div ref={lectureBottomRef} />
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODE 2: QUICK VOICE TRANSLATION (SINGLE UTTERANCE) */}
      {/* ============================================================= */}
      {micMode === 'quick' && (spokenText || translatedText) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: What was heard / Spoken in Original Language */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-bengali">
                    ১. যা শোনা গেছে (মূল ভাষা)
                  </span>
                </div>
                {detectedLang && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                    {detectedLang}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <p
                  className={`text-slate-800 leading-relaxed text-base sm:text-lg select-text ${
                    isArabicScript(spokenText) ? 'font-arabic text-right text-xl' : ''
                  }`}
                  dir={isArabicScript(spokenText) ? 'rtl' : 'ltr'}
                >
                  {spokenText}
                </p>

                {transliteration && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <span className="font-semibold text-slate-500">উচ্চারণ: </span>
                    {transliteration}
                  </div>
                )}
              </div>
            </div>

            {/* Actions for Original */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() =>
                  handleSpeak(
                    spokenText,
                    isArabicScript(spokenText) ? 'ar' : 'en',
                    'quick_orig'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-slate-600" />
                <span>উচ্চারণ শুনুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(spokenText, 'quick_orig')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                {copiedId === 'quick_orig' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Translated into Bengali */}
          <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-bengali">
                    ২. সহজ বাংলায় অনুবাদ
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  সাবলীল বাংলা
                </span>
              </div>

              <div className="mt-4">
                <p className="text-slate-900 leading-relaxed text-base sm:text-lg font-bengali select-text">
                  {translatedText}
                </p>
              </div>
            </div>

            {/* Actions for Translation */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() =>
                  handleSpeak(translatedText, 'bn', 'quick_trans')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
              >
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span>বাংলায় শুনুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyText(translatedText, 'quick_trans')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
              >
                {copiedId === 'quick_trans' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Classroom Question & Answer Pop-up */}
      <AutoQuestionAnswerPopup
        isOpen={isQAPopupOpen}
        onClose={() => setIsQAPopupOpen(false)}
        currentQuestion={currentQuestion}
        questionHistory={questionHistory}
        onSaveToNotebook={(title, content, tags) => {
          if (onSaveToNotebook && currentQuestion) {
            onSaveToNotebook(
              title,
              content,
              currentQuestion.originalQuestion,
              currentQuestion.detectedLanguage,
              'study_notes'
            );
          }
        }}
        contextText={segments.slice(-3).map((s) => s.translation).join('\n')}
        sourceType="lecture"
      />
    </div>
  );
};
