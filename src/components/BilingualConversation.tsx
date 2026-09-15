import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  User,
  Users,
  Sparkles,
  Download,
  Trash2,
  BookmarkPlus,
  RefreshCw,
  Copy,
  Check,
  Languages,
  Radio,
  ArrowRightLeft,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';
import { ConversationMessage, DetectedInClassQuestion } from '../types';
import { TARGET_LANGUAGES } from '../languages';
import { blobToBase64, speakText, triggerFileDownload } from '../utils/audioUtils';
import { AutoQuestionAnswerPopup } from './AutoQuestionAnswerPopup';

interface BilingualConversationProps {
  onSaveToNotebook: (title: string, content: string, category: any, originalText?: string) => void;
}

export const BilingualConversation: React.FC<BilingualConversationProps> = ({ onSaveToNotebook }) => {
  // Person 1 State (Bangladeshi / Local speaker)
  const [p1Name, setP1Name] = useState('ব্যক্তি ১ (বাংলাদেশী)');
  const [p1Lang, setP1Lang] = useState('bn');
  const [p1Gender, setP1Gender] = useState<'male' | 'female'>('female');
  const [p1TextInput, setP1TextInput] = useState('');
  const [p1Recording, setP1Recording] = useState(false);

  // Person 2 State (Foreigner / Guest speaker)
  const [p2Name, setP2Name] = useState('ব্যক্তি ২ (বিদেশী অতিথি)');
  const [p2Lang, setP2Lang] = useState('ar');
  const [p2Gender, setP2Gender] = useState<'male' | 'female'>('male');
  const [p2TextInput, setP2TextInput] = useState('');
  const [p2Recording, setP2Recording] = useState(false);

  // Real-time Voice Responsiveness & Visualizer State
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyBars, setFrequencyBars] = useState<number[]>([12, 18, 25, 20, 35, 42, 28, 18, 32, 45, 25, 15]);
  const [liveInterimText, setLiveInterimText] = useState('');

  // System Settings & Conversation History
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [autoDetectQuestions, setAutoDetectQuestions] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<DetectedInClassQuestion | null>(null);
  const [questionHistory, setQuestionHistory] = useState<DetectedInClassQuestion[]>([]);
  const [isQAPopupOpen, setIsQAPopupOpen] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 'welcome-1',
      sender: 'person1',
      speakerName: 'ব্যক্তি ১ (বাংলাদেশী)',
      originalText: 'আসসালামু আলাইকুম! আমাদের বাংলাদেশে আপনাকে স্বাগতম। আপনি কোথা থেকে এসেছেন?',
      translatedText: 'السلام عليكم! مرحباً بكم في بنغلاديش. من أين أتيت؟',
      transliteration: 'Assalamu alaykum! Marhaban bikum...',
      sourceLang: 'bn',
      targetLang: 'ar',
      voiceGender: 'male',
      timestamp: Date.now() - 60000,
    },
    {
      id: 'welcome-2',
      sender: 'person2',
      speakerName: 'ব্যক্তি ২ (বিদেশী অতিথি)',
      originalText: 'وعليكم السلام! شكراً جزيلاً لك، أنا قادم من مكة المكرمة في المملكة العربية السعودية.',
      translatedText: 'ওয়ালাইকুম আসসালাম! আপনাকে অনেক ধন্যবাদ, আমি সৌদি আরবের পবিত্র মক্কা নগরী থেকে এসেছি।',
      transliteration: 'Wa alaykum as-salam! Shukran jazilan...',
      sourceLang: 'ar',
      targetLang: 'bn',
      voiceGender: 'female',
      timestamp: Date.now() - 30000,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'person1' | 'person2' | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      cleanupRecordingResources();
    };
  }, []);

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
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      } else {
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {}
  };

  const cleanupRecordingResources = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
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
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  };

  // Start Voice Recording for Person 1 or 2
  const startRecording = async (speaker: 'person1' | 'person2') => {
    try {
      cleanupRecordingResources();
      playFeedbackChime('start');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([35, 25, 35]);
      }

      setLiveInterimText('');
      setRecordingSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Setup Web Audio API Analyser for real-time visual waves
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
            const step = Math.max(1, Math.floor(dataArray.length / 12));
            for (let i = 0; i < 12; i++) {
              const val = dataArray[i * step] || 0;
              bars.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
              sum += val;
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            setFrequencyBars(bars);
            animFrameRef.current = requestAnimationFrame(updateVisualizer);
          };
          animFrameRef.current = requestAnimationFrame(updateVisualizer);
        }
      } catch (e) {
        console.warn('AudioContext visualization setup failed:', e);
      }

      // Setup Live Speech Recognition for instant on-screen feedback
      try {
        const SpeechRec =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = speaker === 'person1' ? (p1Lang === 'bn' ? 'bn-BD' : p1Lang) : (p2Lang === 'ar' ? 'ar-SA' : p2Lang === 'bn' ? 'bn-BD' : p2Lang);
          rec.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              interim += event.results[i][0].transcript;
            }
            if (interim.trim()) {
              setLiveInterimText(interim.trim());
            }
          };
          rec.start();
          speechRecognitionRef.current = rec;
        }
      } catch (e) {
        console.warn('SpeechRecognition setup notice:', e);
      }

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        cleanupRecordingResources();
        await processTurn(speaker, audioBlob, '');
      };

      recorder.start();
      setActiveSpeaker(speaker);
      if (speaker === 'person1') setP1Recording(true);
      if (speaker === 'person2') setP2Recording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      cleanupRecordingResources();
      alert('মাইক্রোফোনের অনুমতি পাওয়া যায়নি। অনুগ্রহ করে ব্রাউজারের সেটিংস থেকে মাইক পারমিশন দিন।');
    }
  };

  // Stop Voice Recording
  const stopRecording = (speaker: 'person1' | 'person2') => {
    playFeedbackChime('stop');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40]);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speaker === 'person1') setP1Recording(false);
    if (speaker === 'person2') setP2Recording(false);
  };

  // Process a speech or text turn
  const processTurn = async (
    speaker: 'person1' | 'person2',
    audioBlob?: Blob,
    manualText?: string
  ) => {
    setIsProcessing(true);

    const isP1 = speaker === 'person1';
    const sourceLang = isP1 ? p1Lang : p2Lang;
    const targetLang = isP1 ? p2Lang : p1Lang;
    const speakerName = isP1 ? p1Name : p2Name;
    // The voice gender used for speech should match the LISTENER's preference (or speaker's voice)
    const listenerGender = isP1 ? p2Gender : p1Gender;

    try {
      let audioBase64 = '';
      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
      }

      const response = await fetch('/api/translate/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioBase64 || undefined,
          textInput: manualText || undefined,
          sourceLang,
          targetLang,
          voiceGender: listenerGender,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'অনুবাদ করা সম্ভব হয়নি।');
      }

      const data = await response.json();

      let detectedQ: DetectedInClassQuestion | undefined = undefined;
      if (data.detectedQuestion && data.detectedQuestion.hasQuestion) {
        detectedQ = {
          id: `conv_q_${Date.now()}`,
          source: 'conversation',
          speakerLabel: speakerName,
          timestamp: Date.now(),
          originalQuestion: data.detectedQuestion.questionOriginal || data.originalText || manualText,
          detectedLanguage: data.detectedLanguage || sourceLang,
          translatedQuestion: data.detectedQuestion.questionTranslated || data.translatedText,
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

      const newMsg: ConversationMessage = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: speaker,
        speakerName,
        originalText: data.originalText || manualText || '—',
        translatedText: data.translatedText || '—',
        transliteration: data.transliteration,
        sourceLang,
        targetLang,
        voiceGender: listenerGender,
        timestamp: Date.now(),
        audioBase64: data.audioBase64,
        detectedQuestion: detectedQ,
      };

      setMessages((prev) => [...prev, newMsg]);

      // Automatically play the translated speech in the listener's chosen gender voice!
      if (autoPlayAudio && data.translatedText) {
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audio.play().catch(() => {
            speakText(data.translatedText, targetLang, 1.0, listenerGender);
          });
        } else {
          speakText(data.translatedText, targetLang, 1.0, listenerGender);
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'কথোপকথন অনুবাদে ত্রুটি হয়েছে।');
    } finally {
      setIsProcessing(false);
      setActiveSpeaker(null);
    }
  };

  const handleSendP1Text = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1TextInput.trim()) return;
    const text = p1TextInput.trim();
    setP1TextInput('');
    processTurn('person1', undefined, text);
  };

  const handleSendP2Text = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p2TextInput.trim()) return;
    const text = p2TextInput.trim();
    setP2TextInput('');
    processTurn('person2', undefined, text);
  };

  const handlePlayMessageAudio = (msg: ConversationMessage) => {
    if (msg.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${msg.audioBase64}`);
      audio.play().catch(() => {
        speakText(msg.translatedText, msg.targetLang, 1.0, msg.voiceGender);
      });
    } else {
      speakText(msg.translatedText, msg.targetLang, 1.0, msg.voiceGender);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotebook = (msg: ConversationMessage) => {
    onSaveToNotebook(
      `কথোপকথন: ${msg.speakerName}`,
      `${msg.originalText}\n➔ অনুবাদ: ${msg.translatedText}`,
      'conversation',
      msg.originalText
    );
    setSavedId(msg.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleDownloadTranscript = () => {
    if (messages.length === 0) return;

    let content = `====================================================\n`;
    content += `🤝 দ্বিমুখী লাইভ কথোপকথন ট্রান্সক্রিপ্ট (Bilingual Conversation)\n`;
    content += `তারিখ: ${new Date().toLocaleString('bn-BD')}\n`;
    content += `বক্তা ১: ${p1Name} (${p1Lang})\n`;
    content += `বক্তা ২: ${p2Name} (${p2Lang})\n`;
    content += `====================================================\n\n`;

    messages.forEach((m, idx) => {
      content += `[${idx + 1}] ${m.speakerName} (${new Date(m.timestamp).toLocaleTimeString()}):\n`;
      content += `মূল কথা: "${m.originalText}"\n`;
      content += `অনুবাদ (${m.targetLang}): "${m.translatedText}"\n`;
      if (m.transliteration) content += `উচ্চারণ: ${m.transliteration}\n`;
      content += `----------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerFileDownload(blob, `কথোপকথন_ট্রান্সক্রিপ্ট_${Date.now()}.txt`);
  };

  const handleSwapLanguages = () => {
    setP1Lang(p2Lang);
    setP2Lang(p1Lang);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Control Settings */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-bengali flex items-center gap-2">
                <span>দ্বিভাষিক ফেস-টু-ফেস লাইভ কথোপকথন</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  লাইভ দ্বিভাষিক মাইক
                </span>
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto Play Audio Switch */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 font-bengali cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={autoPlayAudio}
                onChange={(e) => setAutoPlayAudio(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm"
              />
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>স্বয়ংক্রিয় অডিও পাঠ</span>
            </label>

            {/* Auto Detect Questions Switch */}
            <label
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 font-bengali cursor-pointer select-none bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
              title="কেউ প্রশ্ন করলে সাথে সাথে পপআপ ওপেন হয়ে স্বয়ংক্রিয় উত্তর তৈরি করবে"
            >
              <input
                type="checkbox"
                checked={autoDetectQuestions}
                onChange={(e) => setAutoDetectQuestions(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm"
              />
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>অটো প্রশ্ন-উত্তর পপআপ</span>
            </label>

            {questionHistory.length > 0 && (
              <button
                type="button"
                id="conv-open-qa-popup-btn"
                onClick={() => {
                  setCurrentQuestion(questionHistory[0]);
                  setIsQAPopupOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs animate-pulse"
                title="কথোপকথনে শনাক্ত হওয়া প্রশ্ন ও উত্তরের তালিকা"
              >
                <span>❓ প্রশ্ন ও উত্তর ({questionHistory.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadTranscript}
              disabled={messages.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="পুরো ডায়লগ হিস্ট্রি ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ট্রান্সক্রিপ্ট</span>
            </button>

            <button
              type="button"
              onClick={() => setMessages([])}
              disabled={messages.length === 0}
              className="px-3 py-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
              title="মুছে ফেলুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>পরিষ্কার</span>
            </button>
          </div>
        </div>

        {/* Dual Speaker Profile Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
          {/* Swap button in middle */}
          <button
            type="button"
            onClick={handleSwapLanguages}
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-slate-300 shadow-md items-center justify-center text-slate-600 hover:text-emerald-700 hover:border-emerald-500 transition-all"
            title="ভাষা অদল-বদল করুন"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* Speaker 1 Card (Local / Bengali) */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                <input
                  type="text"
                  value={p1Name}
                  onChange={(e) => setP1Name(e.target.value)}
                  className="text-xs font-bold text-emerald-950 bg-transparent border-b border-dashed border-emerald-400 focus:outline-none"
                />
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 uppercase">বক্তা ১</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">ভাষা:</label>
                <select
                  value={p1Lang}
                  onChange={(e) => setP1Lang(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  {TARGET_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">ভয়েস জেন্ডার:</label>
                <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden p-0.5">
                  <button
                    type="button"
                    onClick={() => setP1Gender('female')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      p1Gender === 'female' ? 'bg-pink-100 text-pink-800' : 'text-slate-500'
                    }`}
                  >
                    👩 মহিলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setP1Gender('male')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      p1Gender === 'male' ? 'bg-blue-100 text-blue-800' : 'text-slate-500'
                    }`}
                  >
                    👨 পুরুষ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Speaker 2 Card (Foreigner / Arabic, English, Urdu) */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <input
                  type="text"
                  value={p2Name}
                  onChange={(e) => setP2Name(e.target.value)}
                  className="text-xs font-bold text-indigo-950 bg-transparent border-b border-dashed border-indigo-400 focus:outline-none"
                />
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 uppercase">বক্তা ২</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">ভাষা:</label>
                <select
                  value={p2Lang}
                  onChange={(e) => setP2Lang(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                >
                  {TARGET_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">ভয়েস জেন্ডার:</label>
                <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden p-0.5">
                  <button
                    type="button"
                    onClick={() => setP2Gender('female')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      p2Gender === 'female' ? 'bg-pink-100 text-pink-800' : 'text-slate-500'
                    }`}
                  >
                    👩 মহিলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setP2Gender('male')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      p2Gender === 'male' ? 'bg-blue-100 text-blue-800' : 'text-slate-500'
                    }`}
                  >
                    👨 পুরুষ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Chat Stream */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm min-h-[360px] max-h-[520px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
            <p className="text-sm font-bold text-slate-700 font-bengali">কথোপকথন শুরু করতে নিচের যেকোনো মাইক চেপে কথা বলুন</p>
            <p className="text-xs text-slate-400 mt-1 font-bengali">
              বক্তা ১ বা বক্তা ২ উভয়ের জন্য আলাদা মাইক্রোফোন এবং টেক্সট ইনপুট রয়েছে।
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isP1 = msg.sender === 'person1';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isP1 ? 'items-start' : 'items-end'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-600">{msg.speakerName}</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-xl rounded-3xl p-4 sm:p-5 shadow-xs space-y-2.5 ${
                    isP1
                      ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-tl-sm'
                      : 'bg-indigo-50/80 border border-indigo-200 text-indigo-950 rounded-tr-sm'
                  }`}
                >
                  {/* Original Speech */}
                  <div className="text-xs text-slate-600 italic">
                    <span className="font-semibold text-slate-400 text-[10px] block uppercase not-italic">
                      মূল কথা ({msg.sourceLang}):
                    </span>
                    {msg.originalText}
                  </div>

                  {/* High Quality Translated Speech */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-emerald-800 text-[10px] block uppercase">
                      অনূদিত ({msg.targetLang}):
                    </span>
                    <p className="text-sm font-bold font-bengali leading-relaxed">
                      {msg.translatedText}
                    </p>

                    {msg.transliteration && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        উচ্চারণ: {msg.transliteration}
                      </p>
                    )}
                  </div>

                  {/* Detected Question Alert & Instant Answer Trigger */}
                  {msg.detectedQuestion && (
                    <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-amber-950 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping shrink-0" />
                        <span>❓ প্রশ্ন শনাক্ত হয়েছে! AI উত্তর প্রস্তুত করেছে</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentQuestion(msg.detectedQuestion!);
                          setIsQAPopupOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>উত্তর দেখুন</span>
                      </button>
                    </div>
                  )}

                  {/* Bubble Action Controls */}
                  <div className="pt-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayMessageAudio(msg)}
                        className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-800 font-medium flex items-center gap-1 shadow-2xs transition-colors border border-slate-200"
                        title="অনূদিত ভয়েস শুনুন"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>শুনুন ({msg.voiceGender === 'female' ? 'মহিলা' : 'পুরুষ'} কণ্ঠ)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.translatedText, msg.id)}
                        className="p-1 rounded-lg hover:bg-white/80 text-slate-500"
                        title="কপি করুন"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveToNotebook(msg)}
                      className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-bengali"
                      title="নোটবুকে সংরক্ষণ করুন"
                    >
                      {savedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <BookmarkPlus className="w-3 h-3" />
                      )}
                      <span>{savedId === msg.id ? 'সেভ হয়েছে' : 'নোটবুকে সেভ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Dual Real-Time Microphone & Input Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Person 1 Console (Local) */}
        <div className={`bg-white rounded-3xl p-5 border transition-all ${
          p1Recording ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'border-emerald-300 shadow-sm'
        } space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 font-bengali flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${p1Recording ? 'bg-emerald-500 animate-ping' : 'bg-emerald-600'}`}></span>
              <span>{p1Name}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {p1Recording && (
                <span className="text-[11px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              )}
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                {p1Gender === 'female' ? '👩 মহিলা ভয়েস' : '👨 পুরুষ ভয়েস'}
              </span>
            </div>
          </div>

          {/* Real-Time Live Audio Waveform and Voice Feedback when recording */}
          {p1Recording && (
            <div className="bg-emerald-900/5 rounded-2xl p-3 border border-emerald-500/30 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-1.5 font-bengali text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>মাইক্রোফোন সক্রিয় — আপনার কথা শোনা যাচ্ছে</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-mono">
                  লেভেল: {audioLevel}%
                </span>
              </div>

              {/* Dynamic Soundwave Bars */}
              <div className="flex items-center justify-center gap-1 h-9 px-2 bg-emerald-950/90 rounded-xl">
                {frequencyBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-emerald-400 transition-all duration-75"
                    style={{ height: `${Math.max(14, (height / 100) * 32)}px` }}
                  />
                ))}
              </div>

              {/* Live Interim Speech-to-Text Preview */}
              <div className="bg-white rounded-xl p-2.5 border border-emerald-200 min-h-[36px]">
                <p className="text-[11px] text-slate-500 font-bengali">
                  <span className="font-bold text-emerald-800">লাইভ শুনছি: </span>
                  {liveInterimText ? (
                    <span className="text-slate-900 font-semibold">{liveInterimText}</span>
                  ) : (
                    <span className="italic text-slate-400">কথা বলা শুরু করুন, কথা সাথে সাথেই ধরা পড়বে...</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (p1Recording) stopRecording('person1');
                else startRecording('person1');
              }}
              disabled={isProcessing && activeSpeaker !== 'person1'}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                p1Recording
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white'
              }`}
            >
              {p1Recording ? (
                <>
                  <Zap className="w-4 h-4 animate-bounce text-amber-300" />
                  <span>কথা শেষ — এখনই অনুবাদ পাঠান</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-emerald-300" />
                  <span>মাইকে কথা বলুন ({p1Lang})</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSendP1Text} className="flex gap-2">
            <input
              type="text"
              value={p1TextInput}
              onChange={(e) => setP1TextInput(e.target.value)}
              placeholder="অথবা এখানে বাংলায় লিখুন..."
              disabled={p1Recording || isProcessing}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!p1TextInput.trim() || isProcessing}
              className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Person 2 Console (Foreigner) */}
        <div className={`bg-white rounded-3xl p-5 border transition-all ${
          p2Recording ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500/20' : 'border-indigo-300 shadow-sm'
        } space-y-3`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 font-bengali flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${p2Recording ? 'bg-indigo-500 animate-ping' : 'bg-indigo-600'}`}></span>
              <span>{p2Name}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {p2Recording && (
                <span className="text-[11px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              )}
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                {p2Gender === 'female' ? '👩 মহিলা ভয়েস' : '👨 পুরুষ ভয়েস'}
              </span>
            </div>
          </div>

          {/* Real-Time Live Audio Waveform and Voice Feedback for Speaker 2 */}
          {p2Recording && (
            <div className="bg-indigo-900/5 rounded-2xl p-3 border border-indigo-500/30 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                <span className="flex items-center gap-1.5 font-bengali text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>الميكروفون نشط — جاري الاستماع الفوري</span>
                </span>
                <span className="text-[10px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded font-mono">
                  المستوى: {audioLevel}%
                </span>
              </div>

              {/* Dynamic Soundwave Bars */}
              <div className="flex items-center justify-center gap-1 h-9 px-2 bg-indigo-950/90 rounded-xl">
                {frequencyBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-indigo-400 transition-all duration-75"
                    style={{ height: `${Math.max(14, (height / 100) * 32)}px` }}
                  />
                ))}
              </div>

              {/* Live Interim Speech-to-Text Preview */}
              <div className="bg-white rounded-xl p-2.5 border border-indigo-200 min-h-[36px]">
                <p className="text-[11px] text-slate-500" dir={p2Lang === 'ar' || p2Lang === 'ur' ? 'rtl' : 'ltr'}>
                  <span className="font-bold text-indigo-800">نص حي: </span>
                  {liveInterimText ? (
                    <span className="text-slate-900 font-semibold">{liveInterimText}</span>
                  ) : (
                    <span className="italic text-slate-400">تحدث الآن، سيظهر صوتك هنا فوراً...</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (p2Recording) stopRecording('person2');
                else startRecording('person2');
              }}
              disabled={isProcessing && activeSpeaker !== 'person2'}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                p2Recording
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                  : 'bg-indigo-800 hover:bg-indigo-900 text-white'
              }`}
            >
              {p2Recording ? (
                <>
                  <Zap className="w-4 h-4 animate-bounce text-amber-300" />
                  <span>انقر لإنهاء التسجيل والترجمة فوراً</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-indigo-300" />
                  <span>تحدث الآن ({p2Lang})</span>
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSendP2Text} className="flex gap-2">
            <input
              type="text"
              value={p2TextInput}
              onChange={(e) => setP2TextInput(e.target.value)}
              placeholder="اكتب هنا أو اكتب بالإنجليزية..."
              disabled={p2Recording || isProcessing}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!p2TextInput.trim() || isProcessing}
              className="px-3 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Auto Question & Answer Popup for Conversation */}
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
              'conversation',
              currentQuestion.originalQuestion
            );
          }
        }}
        contextText={messages.slice(-3).map((m) => `${m.speakerName}: ${m.translatedText}`).join('\n')}
        sourceType="conversation"
      />
    </div>
  );
};
