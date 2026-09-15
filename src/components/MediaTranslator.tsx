import React, { useState, useRef } from 'react';
import {
  Upload,
  Music,
  Video,
  Sparkles,
  RefreshCw,
  Volume2,
  Copy,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Globe,
  Headphones,
  Download,
  ExternalLink,
  Clipboard,
  Play
} from 'lucide-react';
import { blobToBase64, speakText, downloadBase64Wav, generateClientAudiobookWav } from '../utils/audioUtils';
import { TranslationResult } from '../types';
import { AudiobookPlayerModal } from './AudiobookPlayerModal';
import { ContentStudyExplainer } from './ContentStudyExplainer';

interface MediaTranslatorProps {
  targetLang: string;
  onSaveResult: (result: TranslationResult) => void;
  onSaveToNotebook?: (title: string, content: string, tags: string[]) => void;
}

export const MediaTranslator: React.FC<MediaTranslatorProps> = ({
  targetLang,
  onSaveResult,
  onSaveToNotebook,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    transcription: string;
    translation: string;
    detectedLanguage: string;
    summary?: string;
    keyPoints?: string[];
    transliteration?: string;
    title?: string;
    author?: string;
    thumbnailUrl?: string;
    embedUrl?: string;
    mediaUrl?: string;
  } | null>(null);

  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const [isAudiobookOpen, setIsAudiobookOpen] = useState(false);
  const [isDownloadingWav, setIsDownloadingWav] = useState(false);
  const [wavDownloaded, setWavDownloaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isVideo = file?.type.startsWith('video/') || file?.name.match(/\.(mp4|webm|mov|mkv)$/i);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setResult(null);

    // Limit file size to 25MB for smooth processing
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('ফাইলের আকার সর্বোচ্চ ২৫ মেগাবাইটের মধ্যে হতে হবে।');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // 1. Process Uploaded File
  const handleTranslateFile = async () => {
    if (!file) {
      setError('দয়া করে কোনো অডিও বা ভিডিও ফাইল নির্বাচন করুন।');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await blobToBase64(file);
      const isVideoFile = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov)$/i);
      const endpoint = isVideoFile ? '/api/translate/video' : '/api/translate/audio';

      const payload = isVideoFile
        ? { videoBase64: base64, mimeType: file.type || 'video/mp4', targetLang }
        : { audioBase64: base64, mimeType: file.type || 'audio/mp3', targetLang };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'মিডিয়া ফাইল প্রসেস করতে ব্যর্থ হয়েছে।');
      }

      const data = await response.json();
      setResult(data);

      onSaveResult({
        id: 'media_' + Date.now(),
        mode: 'media',
        timestamp: Date.now(),
        sourceLang: data.detectedLanguage || 'Auto',
        targetLang: targetLang === 'bn' ? 'বাংলা' : targetLang,
        detectedLang: data.detectedLanguage,
        originalText: data.transcription,
        translatedText: data.translation,
        summary: data.summary,
        keyPoints: data.keyPoints,
        transliteration: data.transliteration,
        mediaName: file.name,
        mediaType: isVideoFile ? 'video' : 'audio',
      });
    } catch (err: any) {
      console.error('Media translation failed:', err);
      setError(err.message || 'অনুবাদ করা সম্ভব হয়নি। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Process Media Link / URL (YouTube, Facebook, Podcasts, etc.)
  const handleTranslateUrl = async (customUrl?: string) => {
    const urlToUse = (customUrl || mediaUrlInput).trim();
    if (!urlToUse) {
      setError('দয়া করে একটি ইউটিউব, ফেসবুক বা অডিও/ভিডিও মিডিয়া লিংক দিন।');
      return;
    }

    if (!urlToUse.startsWith('http://') && !urlToUse.startsWith('https://')) {
      setError('লিংকটি অবশ্যই http:// অথবা https:// দিয়ে শুরু হতে হবে।');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/translate/media-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: urlToUse, targetLang }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'লিংক থেকে মিডিয়া বিশ্লেষণ ব্যর্থ হয়েছে।');
      }

      const data = await response.json();
      setResult(data);

      onSaveResult({
        id: 'url_media_' + Date.now(),
        mode: 'media',
        timestamp: Date.now(),
        sourceLang: data.detectedLanguage || 'Auto',
        targetLang: targetLang === 'bn' ? 'বাংলা' : targetLang,
        detectedLang: data.detectedLanguage,
        originalText: data.transcription,
        translatedText: data.translation,
        summary: data.summary,
        keyPoints: data.keyPoints,
        transliteration: data.transliteration,
        mediaName: data.title || urlToUse,
        mediaType: 'url',
        mediaUrl: urlToUse,
        thumbnailUrl: data.thumbnailUrl,
        embedUrl: data.embedUrl,
        author: data.author,
      });
    } catch (err: any) {
      console.error('Media URL translation error:', err);
      setError(err.message || 'লিংকটি থেকে অডিও/ভিডিও উদ্ধার বা অনুবাদ করা সম্ভব হয়নি।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setMediaUrlInput(text);
        setError(null);
      }
    } catch {
      // Permission denied or not supported
    }
  };

  const handleCopy = (text: string, isOriginal: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOriginal) {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedTranslation(true);
      setTimeout(() => setCopiedTranslation(false), 2000);
    }
  };

  // Download direct WAV audiobook
  const handleQuickWavDownload = async () => {
    if (!result?.translation) return;
    setIsDownloadingWav(true);
    setWavDownloaded(false);

    try {
      const title = result.title || file?.name || 'অনূদিত_অডিও';
      const response = await fetch('/api/tts/audiobook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: result.translation,
          title,
          voice: 'Puck',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          downloadBase64Wav(data.audioBase64, data.fileName || `${title}_audiobook.wav`);
          setWavDownloaded(true);
          setTimeout(() => setWavDownloaded(false), 3000);
          return;
        }
      }

      generateClientAudiobookWav(result.translation, `${title}_audiobook.wav`);
      setWavDownloaded(true);
      setTimeout(() => setWavDownloaded(false), 3000);
    } catch (err) {
      console.warn('WAV download fallback:', err);
      generateClientAudiobookWav(result.translation, 'audiobook.wav');
      setWavDownloaded(true);
      setTimeout(() => setWavDownloaded(false), 3000);
    } finally {
      setIsDownloadingWav(false);
    }
  };

  // Sample quick test buttons
  const handleSample = async (type: 'arabic_lecture' | 'english_podcast') => {
    setIsProcessing(true);
    setError(null);
    try {
      const sampleText =
        type === 'arabic_lecture'
          ? 'بسم الله الرحمن الرحيم، الحمد لله رب العالمين والصلاة والسلام على رسولنا محمد وعلى آله وصحبه أجمعين. موضوع حديثنا اليوم هو الإخلاص في العمل والصدق في القول.'
          : 'Welcome to our technology and innovation podcast. Today we explore how artificial intelligence is breaking down language barriers and allowing people around the globe to communicate with ease.';

      const response = await fetch('/api/translate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          sourceLang: type === 'arabic_lecture' ? 'ar' : 'en',
          targetLang: 'bn',
        }),
      });

      if (!response.ok) throw new Error('নমুনা বিশ্লেষণে সমস্যা হয়েছে');
      const data = await response.json();

      setResult({
        title: type === 'arabic_lecture' ? 'আরবি ইসলামিক বক্তব্য (নমুনা)' : 'ইংরেজি টেকনোলজি পডকাস্ট (নমুনা)',
        author: type === 'arabic_lecture' ? 'শায়খ / বক্তা' : 'Tech Podcast Host',
        transcription: sampleText,
        translation: data.translation,
        detectedLanguage: type === 'arabic_lecture' ? 'আরবি (Arabic)' : 'ইংরেজি (English)',
        summary:
          data.summary ||
          (type === 'arabic_lecture'
            ? 'কাজে আন্তরিকতা ও সততা নিয়ে আলোচনা।'
            : 'ভাষা অনুবাদে কৃত্রিম বুদ্ধিমত্তার ভূমিকা নিয়ে আলোচনা।'),
        keyPoints: [
          type === 'arabic_lecture' ? 'আল্লাহর প্রশংসা ও রাসুল (সা.)-এর উপর দরূদ' : 'ভাষা শিক্ষার নতুন দিগন্ত',
          type === 'arabic_lecture' ? 'কাজে ইখলাস ও সত্যবাদিতার গুরুত্ব' : 'বিশ্বজুড়ে সহজ যোগাযোগের সুযোগ',
        ],
        transliteration: data.transliteration,
      });

      onSaveResult({
        id: 'sample_media_' + Date.now(),
        mode: 'media',
        timestamp: Date.now(),
        sourceLang: type === 'arabic_lecture' ? 'Arabic' : 'English',
        targetLang: 'বাংলা',
        originalText: sampleText,
        translatedText: data.translation,
        summary: data.summary,
        mediaName: type === 'arabic_lecture' ? 'Arabic_Speech_Sample.mp3' : 'English_Podcast_Sample.mp3',
        mediaType: 'audio',
      });
    } catch (err: any) {
      setError(err.message || 'নমুনা লোড করা যায়নি');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher: File Upload vs URL Link */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200">
          <button
            type="button"
            id="tab-upload-media"
            onClick={() => {
              setActiveTab('upload');
              setError(null);
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ফাইল আপলোড</span>
          </button>

          <button
            type="button"
            id="tab-url-media"
            onClick={() => {
              setActiveTab('url');
              setError(null);
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'url'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>অনলাইন লিংক</span>
          </button>
        </div>
      </div>

      {/* 1. Upload Box Tab */}
      {activeTab === 'upload' && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors shadow-2xs"
        >
          <div className="flex flex-col items-center text-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-bengali">
              অডিও বা ভিডিও ফাইল আপলোড
            </h3>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              id="media-file-input"
              accept="audio/*,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                type="button"
                id="browse-media-button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>ফাইল বেছে নিন</span>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> MP3, WAV, M4A, OGG
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5" /> MP4, WEBM, MOV (সর্বোচ্চ ২৫MB)
              </span>
            </div>

            {/* Sample quick test buttons */}
            <div className="mt-5 pt-4 border-t border-slate-100 w-full flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-bengali">নমুনা ফাইল নিয়ে পরীক্ষা করুন:</span>
              <button
                type="button"
                onClick={() => handleSample('arabic_lecture')}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                🇸🇦 আরবি অডিও বক্তব্য নমুনা
              </button>
              <button
                type="button"
                onClick={() => handleSample('english_podcast')}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                🇬🇧 ইংরেজি পডকাস্ট নমুনা
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. URL Link Input Tab */}
      {activeTab === 'url' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-bengali">
                  অনলাইন ভিডিও বা অডিও লিংক থেকে সরাসরি অনুবাদ
                </h3>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    type="url"
                    id="media-url-input-field"
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... বা Facebook ভিডিও লিংক"
                    className="w-full pl-10 pr-24 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isProcessing) {
                        handleTranslateUrl();
                      }
                    }}
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />

                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="absolute right-2.5 top-2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition-colors"
                    title="ক্লিপবোর্ড থেকে পেস্ট করুন"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>পেস্ট</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="submit-media-url-button"
                  onClick={() => handleTranslateUrl()}
                  disabled={isProcessing || !mediaUrlInput.trim()}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>লিংক থেকে অনুবাদ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>অনুবাদ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo URLs for Testing */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-bengali">পরীক্ষার জন্য নমুনা লিংক:</span>
              <button
                type="button"
                onClick={() => {
                  const url = 'https://www.youtube.com/watch?v=k1t64l64f-4';
                  setMediaUrlInput(url);
                  handleTranslateUrl(url);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                🎥 ইউটিউব ইসলামিক লেকচার
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                  setMediaUrlInput(url);
                  handleTranslateUrl(url);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                🎬 ইংরেজি ভিডিও ক্লিপ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Uploaded File Preview & Translate Trigger */}
      {activeTab === 'upload' && file && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              {isVideo ? <Video className="w-6 h-6" /> : <Music className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Media file'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {filePreviewUrl && (
              <div className="flex-1 sm:flex-none">
                {isVideo ? (
                  <video
                    src={filePreviewUrl}
                    controls
                    className="max-h-24 max-w-[200px] rounded-lg bg-black"
                  />
                ) : (
                  <audio src={filePreviewUrl} controls className="h-10 max-w-[220px]" />
                )}
              </div>
            )}

            <button
              id="translate-media-button"
              type="button"
              onClick={handleTranslateFile}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>অনুবাদ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>বাংলায় অনুবাদ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-5">
          {/* Media Info / Video Embed Preview if URL */}
          {(result.embedUrl || result.thumbnailUrl || result.title) && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                {result.thumbnailUrl && !result.embedUrl && (
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title || 'Thumbnail'}
                    className="w-20 h-14 object-cover rounded-xl border border-slate-200 shadow-2xs"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                      মিডিয়া উৎস
                    </span>
                    {result.author && (
                      <span className="text-xs text-slate-500">
                        • {result.author}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 font-bengali">
                    {result.title || 'অনলাইন ভিডিও/অডিও কন্টেন্ট'}
                  </h4>
                  {result.mediaUrl && (
                    <a
                      href={result.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>মূল লিঙ্কটি খুলুন</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action: Open in Audiobook Mode */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  id="open-audiobook-from-media"
                  onClick={() => setIsAudiobookOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Headphones className="w-4 h-4 text-emerald-300" />
                  <span>🎧 অডিওবুক মোডে শুনুন</span>
                </button>

                <button
                  type="button"
                  id="quick-download-wav"
                  onClick={handleQuickWavDownload}
                  disabled={isDownloadingWav}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
                  title="সম্পূর্ণ বাংলা অনুবাদ অডিওবুক ফাইল হিসেবে ডাউনলোড করুন (.wav)"
                >
                  {isDownloadingWav ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>তৈরি হচ্ছে...</span>
                    </>
                  ) : wavDownloaded ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ডাউনলোড সম্পন্ন!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>অডিও (.wav) ডাউনলোড</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* YouTube Video Player Embed if present */}
          {result.embedUrl && (
            <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video max-h-[380px] w-full max-w-2xl mx-auto shadow-md">
              <iframe
                src={result.embedUrl}
                title={result.title || 'Video player'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Summary Banner */}
          {result.summary && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>সারসংক্ষেপ (Summary)</span>
              </div>
              <p className="text-slate-800 text-sm font-bengali leading-relaxed">
                {result.summary}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Original Spoken Transcript */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-bengali">
                      মূল কথপোকথন / স্ক্রিপ্ট
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {result.detectedLanguage}
                  </span>
                </div>

                <div className="mt-4">
                  <p
                    className={`text-slate-800 text-base leading-relaxed select-text whitespace-pre-line ${
                      result.detectedLanguage.toLowerCase().includes('arab')
                        ? 'font-arabic text-right text-xl'
                        : ''
                    }`}
                    dir={result.detectedLanguage.toLowerCase().includes('arab') ? 'rtl' : 'ltr'}
                  >
                    {result.transcription}
                  </p>

                  {result.transliteration && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">উচ্চারণ: </span>
                      {result.transliteration}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      result.transcription,
                      result.detectedLanguage.toLowerCase().includes('arab') ? 'ar' : 'en'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  <Volume2 className="w-4 h-4 text-slate-600" />
                  <span>উচ্চারণ শুনুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(result.transcription, true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                >
                  {copiedOriginal ? (
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

            {/* Beautiful Bengali Translation */}
            <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500/40 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-bengali">
                      সহজ ও সাবলীল বাংলা অনুবাদ
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    বাংলা
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-slate-900 text-base leading-relaxed font-bengali select-text whitespace-pre-line">
                    {result.translation}
                  </p>

                  {result.keyPoints && result.keyPoints.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-600 mb-2 font-bengali">
                        মূল বিষয়বস্তু / পয়েন্টসমূহ:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside font-bengali">
                        {result.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakText(result.translation, 'bn')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                    <span>বাংলায় শুনুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAudiobookOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-medium shadow-2xs"
                  >
                    <Headphones className="w-3.5 h-3.5 text-emerald-300" />
                    <span>🎧 অডিওবুক প্লেয়ার</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickWavDownload}
                    disabled={isDownloadingWav}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    title="ডাউনলোড অডিও (.wav)"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isDownloadingWav ? 'প্রস্তুত হচ্ছে...' : 'ডাউনলোড (.wav)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(result.translation, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                  >
                    {copiedTranslation ? (
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
          </div>
        </div>
      )}

      {/* AI Study Tutor: Multilingual Summarize & In-Depth Explanation Hub for URL / Video */}
      {(mediaUrlInput.trim() || result) && (
        <ContentStudyExplainer
          contentTitle={result?.title || mediaUrlInput || file?.name || 'অনলাইন মিডিয়া / লিঙ্ক'}
          contentSnippet={
            result
              ? `${result.title || ''}\n${result.summary || ''}\n${result.transcription || ''}\n${result.translation || ''}`
              : undefined
          }
          url={mediaUrlInput.trim() || undefined}
          onSaveToNotebook={onSaveToNotebook}
          defaultLanguage={targetLang === 'en' ? 'en' : targetLang === 'ur' ? 'ur' : 'bn'}
        />
      )}

      {/* Audiobook Modal */}
      {result?.translation && (
        <AudiobookPlayerModal
          isOpen={isAudiobookOpen}
          onClose={() => setIsAudiobookOpen(false)}
          text={result.translation}
          title={result.title || file?.name || 'মিডিয়া অডিওবুক অনুবাদ'}
          lang="bn"
        />
      )}
    </div>
  );
};

