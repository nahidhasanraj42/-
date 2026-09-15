import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Download,
  Volume2,
  Sparkles,
  Check,
  RefreshCw,
  Sliders,
  Headphones,
  RotateCcw
} from 'lucide-react';
import {
  splitIntoAudiobookParagraphs,
  downloadBase64Wav,
  generateClientAudiobookWav
} from '../utils/audioUtils';
import { useBackHandler } from '../utils/backNavigation';

interface AudiobookPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  title?: string;
  lang?: string;
  sourceLang?: string;
}

export const AudiobookPlayerModal: React.FC<AudiobookPlayerModalProps> = ({
  isOpen,
  onClose,
  text,
  title = 'বাংলা অডিওবুক',
  lang = 'bn',
}) => {
  const paragraphs = React.useMemo(() => splitIntoAudiobookParagraphs(text), [text]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const activeParagraphRef = useRef<HTMLDivElement | null>(null);
  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  // Cleanup speech when unmounting or closing
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Scroll active paragraph into view
  useEffect(() => {
    if (activeParagraphRef.current) {
      activeParagraphRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  // Handle device back button
  useBackHandler(
    () => {
      onClose();
      return true;
    },
    90,
    isOpen,
    'audiobook-player'
  );

  if (!isOpen || paragraphs.length === 0) return null;

  // Speaks a specific paragraph
  const speakCurrentParagraph = (index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('আপনার ব্রাউজারে স্পিচ সিন্থেসিস সমর্থিত নয়।');
      return;
    }

    window.speechSynthesis.cancel();

    if (index >= paragraphs.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex(index);
    setIsPlaying(true);
    setIsPaused(false);

    const paraText = paragraphs[index];
    const utterance = new SpeechSynthesisUtterance(paraText);

    utterance.lang = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'bn-BD';
    utterance.rate = rate;

    // Pick best voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang.startsWith('bn') || v.lang.replace('_', '-').startsWith('bn-BD')
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      if (isPlayingRef.current) {
        if (index + 1 < paragraphs.length) {
          speakCurrentParagraph(index + 1);
        } else {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentIndex(0);
        }
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      speakCurrentParagraph(currentIndex);
    }
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (currentIndex + 1 < paragraphs.length) {
      speakCurrentParagraph(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex - 1 >= 0) {
      speakCurrentParagraph(currentIndex - 1);
    }
  };

  const handleSpeedChange = (newRate: number) => {
    setRate(newRate);
    if (isPlaying) {
      // Re-trigger current paragraph with new speed
      speakCurrentParagraph(currentIndex);
    }
  };

  // Download complete audiobook as .wav file
  const handleDownloadAudiobook = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      // 1. Attempt high-fidelity server-side AI voice audiobook WAV synthesis
      const response = await fetch('/api/tts/audiobook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          title,
          voice: 'Puck',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          downloadBase64Wav(data.audioBase64, data.fileName || `${title}_audiobook.wav`);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
          return;
        }
      }

      // 2. Fallback: generate and download client WAV buffer
      generateClientAudiobookWav(text, `${title}_audiobook.wav`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.warn('Server TTS download fallback:', err);
      generateClientAudiobookWav(text, `${title}_audiobook.wav`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / paragraphs.length) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/80 flex items-center justify-center text-emerald-300">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300">
                  স্মার্ট অডিওবুক রিডার
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200">
                  {progressPercent}% সমাপ্ত
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-bengali truncate max-w-[280px] sm:max-w-md">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Audiobook Text Reader Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-slate-800 font-bengali select-text">
          {paragraphs.map((para, idx) => {
            const isActive = idx === currentIndex && (isPlaying || isPaused);
            return (
              <div
                key={idx}
                ref={isActive ? activeParagraphRef : null}
                onClick={() => speakCurrentParagraph(idx)}
                className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-50/90 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-1">
                    {isActive ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-pulse">
                        <Volume2 className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs flex items-center justify-center font-sans font-medium">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-base sm:text-lg leading-relaxed ${
                        isActive ? 'text-emerald-950 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {para}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Audio Controller Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Speed Options */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Sliders className="w-3.5 h-3.5 text-slate-400 mr-1" />
              <span className="font-bengali">গতি:</span>
              {[0.75, 1.0, 1.25, 1.5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                    rate === s
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Playback Controls (Prev, Play/Pause, Next, Stop) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
                title="পূর্ববর্তী অনুচ্ছেদ"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {isPlaying ? (
                <button
                  type="button"
                  id="audiobook-pause-btn"
                  onClick={handlePause}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>থামান</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="audiobook-play-btn"
                  onClick={handlePlay}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isPaused ? 'চালিয়ে যান' : 'পড়ে শোনান'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= paragraphs.length - 1}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
                title="পরবর্তী অনুচ্ছেদ"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleStop}
                className="p-2.5 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-600 transition-colors"
                title="থামিয়ে শুরুতে যান"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Download Audio File Button */}
            <button
              type="button"
              id="download-audiobook-file-btn"
              onClick={handleDownloadAudiobook}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>অডিওবুক তৈরি হচ্ছে...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ডাউনলোড সম্পন্ন!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>অডিওবুক ডাউনলোড (.wav)</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bengali">
              অনুচ্ছেদ {currentIndex + 1} / {paragraphs.length} পড়া হচ্ছে
            </span>
            <span className="font-bengali text-slate-500">
              যেকোনো অনুচ্ছেদে ক্লিক করলে সরাসরি সেই জায়গা থেকে রিড করা শুরু হবে
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
