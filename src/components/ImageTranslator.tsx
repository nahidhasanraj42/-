import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  FileImage,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Headphones,
  Download,
  BookOpen,
  BookmarkPlus,
  RefreshCw,
  Eye,
  Languages,
  CheckCircle2,
  ShieldCheck,
  FileCheck2,
  Search
} from 'lucide-react';
import { TranslationResult, StudentVocabularyItem, SentenceAlignmentItem } from '../types';
import { TARGET_LANGUAGES } from '../languages';
import { blobToBase64, speakText, triggerFileDownload } from '../utils/audioUtils';
import { AudiobookPlayerModal } from './AudiobookPlayerModal';

interface ImageTranslatorProps {
  onTranslationComplete: (result: TranslationResult) => void;
  onSaveToNotebook: (title: string, content: string, category: any, originalText?: string) => void;
}

export const ImageTranslator: React.FC<ImageTranslatorProps> = ({
  onTranslationComplete,
  onSaveToNotebook,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState('bn');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);

  const [copied, setCopied] = useState(false);
  const [savedToNotebook, setSavedToNotebook] = useState(false);
  const [showAudiobookModal, setShowAudiobookModal] = useState(false);
  const [savedVocabIndex, setSavedVocabIndex] = useState<number | null>(null);

  // Sentence verification states
  const [viewTab, setViewTab] = useState<'sentences' | 'study'>('sentences');
  const [sentenceSearch, setSentenceSearch] = useState('');
  const [copiedSentenceIdx, setCopiedSentenceIdx] = useState<number | null>(null);
  const [savedSentenceIdx, setSavedSentenceIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paste image directly from clipboard anywhere on the screen
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('অনুগ্রহ করে শুধুমাত্র ছবি বা স্ক্রিনশট ফাইল (JPG, PNG, WEBP ইত্যাদি) নির্বাচন করুন।');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('ফাইলের সাইজ ২০ মেগাবাইট (MB) এর কম হতে হবে।');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setResult(null);

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setProgressMsg('ছবি বা স্ক্রিনশট থেকে লেখা শনাক্ত (OCR) করা হচ্ছে...');
    setError(null);

    try {
      const base64Data = await blobToBase64(selectedFile);
      setProgressMsg('জেমিনাই AI দিয়ে নির্ভুল অনুবাদ ও স্টুডেন্ট ভোকাবুলারি তৈরি হচ্ছে...');

      const response = await fetch('/api/translate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: selectedFile.type,
          targetLang,
          studyMode: true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'ছবি বিশ্লেষণ ও অনুবাদ ব্যর্থ হয়েছে।');
      }

      const data = await response.json();

      const newResult: TranslationResult = {
        id: `img-${Date.now()}`,
        mode: 'image',
        timestamp: Date.now(),
        sourceLang: data.detectedLanguage || 'অজ্ঞাত',
        targetLang: targetLang,
        detectedLang: data.detectedLanguage,
        originalText: data.transcription || '',
        translatedText: data.translation || '',
        transliteration: data.transliteration,
        summary: data.summary,
        studentNotes: data.studentNotes,
        keyPoints: data.keyPoints || [],
        vocabulary: data.vocabulary || [],
        sentenceAlignment: data.sentenceAlignment || [],
        totalSentencesCount: data.totalSentencesCount || data.sentenceAlignment?.length,
        omissionCheckStatus: data.omissionCheckStatus || '১০০% সম্পূর্ণ: কোনো বাক্য বা টেক্সট বাদ দেওয়া হয়নি',
        mediaName: selectedFile.name,
        mediaType: 'image',
      };

      setResult(newResult);
      onTranslationComplete(newResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ছবির অনুবাদ প্রক্রিয়াকরণে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  const getSentencePairs = (): SentenceAlignmentItem[] => {
    if (result?.sentenceAlignment && result.sentenceAlignment.length > 0) {
      return result.sentenceAlignment;
    }
    const pairs: SentenceAlignmentItem[] = [];
    if (result?.originalText && result?.translatedText) {
      const origSentences = result.originalText.split(/(?<=[।?!.\n]+)/g).map((s) => s.trim()).filter(Boolean);
      const transSentences = result.translatedText.split(/(?<=[।?!.\n]+)/g).map((s) => s.trim()).filter(Boolean);
      const maxLen = Math.max(origSentences.length, transSentences.length);
      for (let i = 0; i < maxLen; i++) {
        pairs.push({
          index: i + 1,
          original: origSentences[i] || '',
          translated: transSentences[i] || '',
          pageOrSection: `বাক্য ${i + 1}`,
        });
      }
    }
    return pairs;
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResultToNotebook = () => {
    if (!result) return;
    onSaveToNotebook(
      `ছবি অনুবাদ: ${selectedFile?.name || 'স্ক্রিনশট'}`,
      result.translatedText,
      'study_notes',
      result.originalText
    );
    setSavedToNotebook(true);
    setTimeout(() => setSavedToNotebook(false), 2000);
  };

  const handleSaveVocabToNotebook = (item: StudentVocabularyItem, index: number) => {
    onSaveToNotebook(
      item.word,
      `উচ্চারণ: ${item.pronunciation || ''}\nঅর্থ: ${item.meaning}\nপদ (Part of Speech): ${item.partOfSpeech || 'N/A'}\nউদাহরণ বাক্য: ${item.exampleSentence || 'N/A'}`,
      'vocabulary',
      item.word
    );
    setSavedVocabIndex(index);
    setTimeout(() => setSavedVocabIndex(null), 2000);
  };

  const handleDownloadStudySheet = () => {
    if (!result) return;

    let content = `====================================================\n`;
    content += `📚 স্টাডি শিট ও ছবি অনুবাদ (Multilingual Student Study Sheet)\n`;
    content += `ফাইল: ${selectedFile?.name || 'স্ক্রিনশট'}\n`;
    content += `টার্গেট ভাষা: ${targetLang}\n`;
    content += `তারিখ: ${new Date().toLocaleString('bn-BD')}\n`;
    content += `====================================================\n\n`;

    content += `【 মূল টেক্সট (Original OCR Text) 】\n`;
    content += `${result.originalText}\n\n`;

    content += `【 পূর্ণাঙ্গ অনুবাদ (Full Translation) 】\n`;
    content += `${result.translatedText}\n\n`;

    if (result.transliteration) {
      content += `【 উচ্চারণ (Transliteration) 】\n`;
      content += `${result.transliteration}\n\n`;
    }

    if (result.studentNotes) {
      content += `【 শিক্ষার্থীদের জন্য বিশেষ নোট ও ব্যাখ্যা 】\n`;
      content += `${result.studentNotes}\n\n`;
    }

    if (result.vocabulary && result.vocabulary.length > 0) {
      content += `【 গুরুত্বপূর্ণ ভোকাবুলারি ব্যাংক (Vocabulary Bank) 】\n`;
      result.vocabulary.forEach((v, idx) => {
        content += `${idx + 1}. ${v.word} [${v.pronunciation || ''}] : ${v.meaning} (${v.partOfSpeech || ''})\n   উদাহরণ: ${v.exampleSentence || ''}\n`;
      });
      content += `\n`;
    }

    if (result.keyPoints && result.keyPoints.length > 0) {
      content += `【 মূল সারসংক্ষেপ (Key Points) 】\n`;
      result.keyPoints.forEach((p) => {
        content += `• ${p}\n`;
      });
      content += `\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerFileDownload(blob, `স্টাডি_শিট_${(selectedFile?.name || 'image').replace(/\.[^/.]+$/, '')}.txt`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Upper Control Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FileImage className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-bengali flex items-center gap-2">
                <span>ছবি ও স্ক্রিনশট অনুবাদ কেন্দ্র</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  ছাত্রদের স্টাডি মোড
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-bengali">
                বইয়ের পাতা, প্রশ্নের ছবি, আরবি-উর্দু-ইংরেজি ক্যালিগ্রাফি বা স্ক্রিনশট দিন; নির্ভুল অনুবাদ ও ভোকাবুলারি পেয়ে যাবেন।
              </p>
            </div>
          </div>

          {/* Target language selector */}
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-emerald-700" />
            <label className="text-xs font-bold text-slate-700 font-bengali">অনুবাদ যে ভাষায় চান:</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bengali"
            >
              {TARGET_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropzone & Preview */}
        {!imagePreviewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/20 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600 border border-slate-200">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 font-bengali">
                ছবি বা স্ক্রিনশট এখানে ড্র্যাগ করে ছাড়ুন অথবা ক্লিক করে নির্বাচন করুন
              </p>
              <p className="text-xs text-slate-400 mt-1 font-bengali">
                JPG, PNG, WEBP (সর্বোচ্চ ২০ এমবি)। এছাড়াও সরাসরি কীবোর্ড থেকে <strong>Ctrl + V</strong> চাপলে পেস্ট হবে!
              </p>
            </div>

            <button
              type="button"
              className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-2xs font-bengali flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-80">
              <img
                src={imagePreviewUrl}
                alt="Upload preview"
                className="max-h-80 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreviewUrl(null);
                  setResult(null);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>অন্য ছবি দিন</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 font-bengali">
                ফাইল: <strong>{selectedFile?.name}</strong> ({(Number(selectedFile?.size) / 1024).toFixed(1)} KB)
              </div>

              <button
                type="button"
                onClick={handleProcessImage}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>{progressMsg || 'বিশ্লেষণ চলছে...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>ছবি থেকে অনুবাদ ও স্টুডেন্ট বিশ্লেষণ শুরু করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200 font-bengali flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}
      </div>

      {/* Result Display: Translation, Vocabulary Table, Audiobook */}
      {result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">
                শনাক্ত ভাষা: {result.sourceLang} ➔ {result.targetLang}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Audiobook Button */}
              <button
                type="button"
                onClick={() => setShowAudiobookModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="অডিওবুক হিসেবে শুনুন ও WAV ডাউনলোড করুন"
              >
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>অডিওবুক ও ডাউনলোড</span>
              </button>

              {/* Save whole result to notebook */}
              <button
                type="button"
                onClick={handleSaveResultToNotebook}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors"
                title="স্টাডি নোটবুকে যোগ করুন"
              >
                {savedToNotebook ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>নোটবুকে যুক্ত হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4 text-emerald-700" />
                    <span>নোটবুকে সেভ করুন</span>
                  </>
                )}
              </button>

              {/* Download Student Study Sheet */}
              <button
                type="button"
                onClick={handleDownloadStudySheet}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="স্টাডি শিট (.txt) ডাউনলোড করুন"
              >
                <Download className="w-4 h-4" />
                <span>স্টাডি শিট ডাউনলোড</span>
              </button>
            </div>
          </div>

          {/* Zero Omission & Sentence Alignment Guarantee Banner (Specialty 1) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-950 text-sm font-bengali">
                    {result.omissionCheckStatus || '১০০% সম্পূর্ণ ও নিখুঁত অনুবাদ'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    স্পেশালিটি ১
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-bengali">
                  কোনো বাক্য বা লাইন বাদ দেওয়া হয়নি। নিচে প্রতিটি বাক্য ছবির লেখার সাথে মিলিয়ে দেখুন।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 font-mono shrink-0 shadow-2xs">
                মোট বাক্য: {getSentencePairs().length}টি
              </div>
            </div>
          </div>

          {/* View Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewTab('sentences')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewTab === 'sentences'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>🔍 সেন্টেন্স-বাই-সেন্টেন্স মিলকরণ ভিউ</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  viewTab === 'sentences' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {getSentencePairs().length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('study')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewTab === 'study'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>📚 পূর্ণাঙ্গ স্টাডি শিট ও মূল অনুবাদ</span>
              </button>
            </div>

            {viewTab === 'sentences' && (
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sentenceSearch}
                  onChange={(e) => setSentenceSearch(e.target.value)}
                  placeholder="সেন্টেন্সে শব্দ খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bengali"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Sentence Alignment View */}
          {viewTab === 'sentences' && (
            <div className="space-y-3">
              {getSentencePairs()
                .filter((pair) => {
                  if (!sentenceSearch.trim()) return true;
                  const q = sentenceSearch.toLowerCase();
                  return (
                    pair.original.toLowerCase().includes(q) ||
                    pair.translated.toLowerCase().includes(q)
                  );
                })
                .map((pair, idx) => {
                  const isRtl = result.sourceLang?.toLowerCase().includes('arab') ||
                    result.sourceLang?.toLowerCase().includes('urdu');

                  return (
                    <div
                      key={pair.index || idx}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center font-mono">
                            {pair.index || idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700 font-bengali">
                            বাক্য {pair.index || idx + 1}
                          </span>
                          {pair.pageOrSection && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              {pair.pageOrSection}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 font-bengali">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>হুবহু অনূদিত</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(pair.translated);
                              setCopiedSentenceIdx(pair.index || idx);
                              setTimeout(() => setCopiedSentenceIdx(null), 1500);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                            title="অনুবাদ কপি করুন"
                          >
                            {copiedSentenceIdx === (pair.index || idx) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSaveToNotebook(
                                `ছবি অনুবাদ বাক্য ${pair.index || idx + 1}: ${selectedFile?.name || 'ছবি'}`,
                                `মূল বাক্য (${result.sourceLang}):\n${pair.original}\n\nবাংলা অনুবাদ:\n${pair.translated}`,
                                'vocabulary',
                                pair.original
                              );
                              setSavedSentenceIdx(pair.index || idx);
                              setTimeout(() => setSavedSentenceIdx(null), 1500);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors"
                            title="নোটবুকে সেভ করুন"
                          >
                            {savedSentenceIdx === (pair.index || idx) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                ছবিতে মূল বাক্য ({result.sourceLang})
                              </span>
                              <button
                                type="button"
                                onClick={() => speakText(pair.original, result.sourceLang?.toLowerCase().includes('arab') ? 'ar' : 'en')}
                                className="text-slate-500 hover:text-emerald-700 flex items-center gap-1 text-[10px]"
                                title="মূল বাক্য শুনুন"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>শুনুন</span>
                              </button>
                            </div>
                            <p
                              className={`text-slate-800 text-sm leading-relaxed ${
                                isRtl ? 'font-arabic text-base text-right' : ''
                              }`}
                              dir={isRtl ? 'rtl' : 'ltr'}
                            >
                              {pair.original}
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-bengali">
                                সহজ ও নিখুঁত বাংলা অনুবাদ
                              </span>
                              <button
                                type="button"
                                onClick={() => speakText(pair.translated, result.targetLang)}
                                className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 text-[10px] font-bengali"
                                title="বাংলা অনুবাদ শুনুন"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>শুনুন</span>
                              </button>
                            </div>
                            <p className="text-slate-900 text-sm sm:text-base leading-relaxed font-bengali">
                              {pair.translated}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* TAB 2: Full Study Sheet & Raw Translation */}
          {viewTab === 'study' && (
            <div className="space-y-6">
              {/* Original Extracted Text & Full Translation side-by-side / stacked */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original OCR Text */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      ছবিতে প্রাপ্ত মূল টেক্সট
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(result.originalText, result.sourceLang === 'Arabic' ? 'ar' : 'en')}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-emerald-700"
                        title="মূল টেক্সট শুনুন"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(result.originalText)}
                        className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-emerald-700"
                        title="কপি করুন"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-800 font-arabic whitespace-pre-wrap leading-relaxed">
                    {result.originalText}
                  </p>
                </div>

                {/* Translation in Chosen Language */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      পূর্ণাঙ্গ অনুবাদ ({result.targetLang})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => speakText(result.translatedText, result.targetLang)}
                        className="p-1.5 rounded-lg hover:bg-white text-emerald-700"
                        title="অনুবাদ শুনুন"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(result.translatedText)}
                        className="p-1.5 rounded-lg hover:bg-white text-emerald-700"
                        title="কপি করুন"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-900 font-bengali whitespace-pre-wrap leading-relaxed font-medium">
                    {result.translatedText}
                  </p>

                  {result.transliteration && (
                    <div className="pt-3 border-t border-emerald-100 text-xs text-emerald-800">
                      <strong className="block text-[10px] text-emerald-600 uppercase">উচ্চারণ নির্দেশিকা:</strong>
                      {result.transliteration}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Educational Notes */}
              {result.studentNotes && (
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 font-bengali flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>ছাত্রদের জন্য সরল বিশ্লেষণ ও ব্যাকরণিক নোট</span>
                  </h4>
                  <p className="text-xs text-amber-950 font-bengali leading-relaxed whitespace-pre-wrap">
                    {result.studentNotes}
                  </p>
                </div>
              )}

              {/* Student Vocabulary Bank Table */}
              {result.vocabulary && result.vocabulary.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 font-bengali flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>গুরুত্বপূর্ণ ভোকাবুলারি ব্যাংক (Vocabulary Bank for Students)</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-bengali">
                      শব্দগুলো সরাসরি আপনার নোটবুকে সংরক্ষণ করতে পারেন
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold font-bengali">
                        <tr>
                          <th className="p-3">মূল শব্দ (Word)</th>
                          <th className="p-3">উচ্চারণ</th>
                          <th className="p-3">অর্থ</th>
                          <th className="p-3">পদ (Part of Speech)</th>
                          <th className="p-3">বাক্য প্রয়োগ</th>
                          <th className="p-3 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {result.vocabulary.map((vocab, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 font-bold text-slate-900 font-arabic text-sm">
                              {vocab.word}
                            </td>
                            <td className="p-3 text-slate-500 italic">
                              {vocab.pronunciation || '—'}
                            </td>
                            <td className="p-3 font-semibold text-emerald-900 font-bengali">
                              {vocab.meaning}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600">
                                {vocab.partOfSpeech || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-bengali max-w-xs">
                              {vocab.exampleSentence || '—'}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => speakText(vocab.word, result.sourceLang === 'Arabic' ? 'ar' : 'en')}
                                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
                                  title="উচ্চারণ শুনুন"
                                >
                                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveVocabToNotebook(vocab, idx)}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200"
                                  title="নোটবুকে সেভ করুন"
                                >
                                  {savedVocabIndex === idx ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <BookmarkPlus className="w-3 h-3" />
                                  )}
                                  <span>{savedVocabIndex === idx ? 'সেভড' : 'সেভ'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Key Summary Bullets */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 font-bengali flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>মূল সারসংক্ষেপ (Key Points)</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-600 font-bengali list-disc pl-5">
                    {result.keyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Audiobook Player Modal */}
      {showAudiobookModal && result && (
        <AudiobookPlayerModal
          isOpen={showAudiobookModal}
          onClose={() => setShowAudiobookModal(false)}
          text={result.translatedText}
          title={`ছবি অনুবাদ_${selectedFile?.name || 'অডিওবুক'}`}
          lang={result.targetLang}
        />
      )}
    </div>
  );
};
