import React, { useState } from 'react';
import { Sparkles, RefreshCw, Volume2, Copy, Check, AlertCircle, BookOpen, Trash2 } from 'lucide-react';
import { speakText } from '../utils/audioUtils';
import { TranslationResult } from '../types';

interface TextTranslatorProps {
  sourceLang: string;
  targetLang: string;
  onSaveResult: (result: TranslationResult) => void;
  onUpdateDetectedLang?: (lang: string) => void;
}

export const TextTranslator: React.FC<TextTranslatorProps> = ({
  sourceLang,
  targetLang,
  onSaveResult,
  onUpdateDetectedLang,
}) => {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState<'simple' | 'formal' | 'conversational' | 'islamic'>('simple');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    originalText: string;
    translation: string;
    detectedLanguage: string;
    transliteration?: string;
    summary?: string;
    wordBreakdown?: { word: string; meaning: string }[];
  } | null>(null);

  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);

  const isArabicInput =
    sourceLang === 'ar' || /[\u0600-\u06FF]/.test(inputText);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('অনুবাদ করার জন্য কিছু টেক্সট লিখুন বা পেস্ট করুন।');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/translate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          sourceLang,
          targetLang,
          tone,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'অনুবাদ করা সম্ভব হয়নি।');
      }

      const data = await response.json();
      setResult(data);
      if (data.detectedLanguage && onUpdateDetectedLang) {
        onUpdateDetectedLang(data.detectedLanguage);
      }

      onSaveResult({
        id: 'text_' + Date.now(),
        mode: 'text',
        timestamp: Date.now(),
        sourceLang: data.detectedLanguage || sourceLang,
        targetLang: targetLang === 'bn' ? 'বাংলা' : targetLang,
        detectedLang: data.detectedLanguage,
        originalText: inputText,
        translatedText: data.translation,
        transliteration: data.transliteration,
        summary: data.summary,
      });
    } catch (err: any) {
      console.error('Text translation error:', err);
      setError(err.message || 'অনুবাদে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
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

  const setSamplePhrase = (text: string) => {
    setInputText(text);
    setError(null);
  };

  const samplePhrases = [
    {
      lang: 'ar',
      label: '🇸🇦 আরবি সম্ভাষণ',
      text: 'السلام عليكم ورحمة الله وبركاته، أهلاً وسهلاً بكم في تطبيق الترجمة.',
    },
    {
      lang: 'ar',
      label: '🇸🇦 আরবি দোয়া / উক্তি',
      text: 'جزاك الله خيراً وبارك الله فيك وفي أهلك، ونسأل الله التوفيق للجميع.',
    },
    {
      lang: 'en',
      label: '🇬🇧 ইংরেজি প্রশ্ন',
      text: 'Could you please explain how this multilingual voice translation tool works?',
    },
    {
      lang: 'en',
      label: '🇬🇧 ইংরেজি বার্তা',
      text: 'Clear communication across different cultures brings people closer together and creates new possibilities.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Input / Output Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Source Text Input */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between focus-within:border-emerald-500 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-bengali">
                  উৎস টেক্সট লিখুন
                </span>
              </div>
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              )}
            </div>

            <textarea
              id="source-text-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="এখানে আরবি, ইংরেজি বা যেকোনো ভাষায় টেক্সট লিখুন অথবা পেস্ট করুন..."
              rows={8}
              dir={isArabicInput ? 'rtl' : 'ltr'}
              className={`w-full mt-3 p-2 bg-transparent text-slate-900 focus:outline-hidden resize-none text-base placeholder:text-slate-400 leading-relaxed ${
                isArabicInput ? 'font-arabic text-xl' : ''
              }`}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>{inputText.length} অক্ষর</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.readText().then((txt) => setInputText(txt));
                }}
                className="px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-700 font-medium"
              >
                পেস্ট করুন
              </button>
            </div>
          </div>
        </div>

        {/* Translation Output */}
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-500/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-bengali">
                  সহজ বাংলায় অনুবাদ
                </span>
              </div>
              {result?.detectedLanguage && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  শনাক্ত: {result.detectedLanguage}
                </span>
              )}
            </div>

            <div className="mt-3 min-h-[160px]">
              {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-bengali">অনুবাদ করা হচ্ছে...</span>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  <p className="text-slate-900 text-base leading-relaxed font-bengali select-text whitespace-pre-line">
                    {result.translation}
                  </p>

                  {result.transliteration && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold text-slate-500">উচ্চারণ: </span>
                      {result.transliteration}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center py-12 text-slate-400 text-xs font-bengali text-center">
                  বামপাশে কোনো লেখা দিয়ে "অনুবাদ করুন" বাটনে চাপলে এখানে বাংলায় দেখতে পাবেন
                </div>
              )}
            </div>
          </div>

          {result && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => speakText(result.translation, 'bn')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
              >
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span>উচ্চারণ শুনুন</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(result.translation, false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
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
          )}
        </div>
      </div>

      {/* Control Bar: Tone + Translate Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tone Options */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 font-bengali">ভাষার ধরন:</span>
          {(
            [
              { id: 'simple', label: 'সহজ ও প্রাঞ্জল' },
              { id: 'formal', label: 'অফিসিয়াল / ফর্মাল' },
              { id: 'conversational', label: 'কথোপকথন' },
              { id: 'islamic', label: 'ইসলামিক প্রসঙ্গ' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tone === t.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          id="translate-text-action-button"
          type="button"
          onClick={handleTranslate}
          disabled={isProcessing || !inputText.trim()}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>অনুবাদ হচ্ছে...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>অনুবাদ করুন</span>
            </>
          )}
        </button>
      </div>

      {/* Vocabulary Breakdown (Word meanings if provided) */}
      {result?.wordBreakdown && result.wordBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold uppercase tracking-wider mb-3 font-bengali">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>গুরুত্বপূর্ণ শব্দের অর্থ ও ব্যাখ্যা (শব্দার্থ)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {result.wordBreakdown.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-900 block font-arabic text-sm">
                  {item.word}
                </span>
                <span className="text-slate-600 font-bengali">{item.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Phrase Chips */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 font-bengali pl-1">
          ক্লিক করে দ্রুত নমুনা টেক্সট পরখ করুন:
        </p>
        <div className="flex flex-wrap gap-2">
          {samplePhrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSamplePhrase(phrase.text)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-slate-700 text-xs font-medium transition-all text-left"
            >
              <span className="font-semibold text-emerald-700 mr-1.5">{phrase.label}:</span>
              <span className="text-slate-600 truncate max-w-[200px] inline-block align-bottom">
                {phrase.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
