import React, { useState, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Lightbulb,
  HelpCircle,
  Volume2,
  Copy,
  Check,
  Download,
  BookmarkPlus,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { StudyLanguage, StudyExplanationStyle, StudyExplanationResult } from '../types';
import { speakText } from '../utils/audioUtils';

interface ContentStudyExplainerProps {
  contentTitle?: string;
  contentSnippet?: string;
  url?: string;
  fileBase64?: string;
  mimeType?: string;
  onSaveToNotebook?: (title: string, content: string, tags: string[]) => void;
  defaultLanguage?: StudyLanguage;
}

export const ContentStudyExplainer: React.FC<ContentStudyExplainerProps> = ({
  contentTitle,
  contentSnippet,
  url,
  fileBase64,
  mimeType,
  onSaveToNotebook,
  defaultLanguage = 'bn',
}) => {
  const [selectedLang, setSelectedLang] = useState<StudyLanguage>(defaultLanguage);
  const [explanationStyle, setExplanationStyle] = useState<StudyExplanationStyle>('academic');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studyResult, setStudyResult] = useState<StudyExplanationResult | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const [copied, setCopied] = useState(false);
  const [savedToNotebookSuccess, setSavedToNotebookSuccess] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const resultContainerRef = useRef<HTMLDivElement | null>(null);

  const languages: { code: StudyLanguage; label: string; flag: string; sub: string }[] = [
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩', sub: 'সহজ প্রাঞ্জল বাংলা' },
    { code: 'en', label: 'English', flag: '🇬🇧', sub: 'Academic English' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰', sub: 'سلیس اور آسان اردو' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦', sub: 'فصحى أكاديمية' },
  ];

  const handleExecute = async (
    action: 'summarize' | 'explain' | 'interactive_query',
    style: StudyExplanationStyle = explanationStyle,
    overrideQuestion?: string
  ) => {
    setIsProcessing(true);
    setError(null);

    const questionToAsk = overrideQuestion !== undefined ? overrideQuestion : customQuestion;

    try {
      const response = await fetch('/api/study/explain-and-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: contentSnippet,
          url,
          fileBase64,
          mimeType,
          action,
          language: selectedLang,
          style,
          customQuestion: questionToAsk,
          chatHistory: chatHistory.slice(-4),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'বিশ্লেষণ সম্পন্ন করা সম্ভব হয়নি।');
      }

      const data: StudyExplanationResult = await response.json();
      setStudyResult(data);

      if (action === 'interactive_query' && questionToAsk) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'user', text: questionToAsk },
          { role: 'assistant', text: data.detailedExplanation || data.overview },
        ]);
        setCustomQuestion('');
      }

      setTimeout(() => {
        resultContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err: any) {
      console.error('Study Explainer error:', err);
      setError(err.message || 'একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!studyResult) return;
    const textToCopy = `${studyResult.title} (${studyResult.languageUsed})

[মূল সারসংক্ষেপ / Overview]
${studyResult.overview}

[বিস্তারিত ব্যাখ্যা / Detailed Explanation]
${studyResult.detailedExplanation}

${studyResult.keyPoints?.length ? `[প্রধান পয়েন্টসমূহ]\n` + studyResult.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : ''}

${studyResult.realWorldExamples?.length ? `\n[বাস্তব উদাহরণ / Real-World Examples]\n` + studyResult.realWorldExamples.map((ex, i) => `• ${ex}`).join('\n') : ''}

${studyResult.examStudyTips?.length ? `\n[পরীক্ষার টিপস ও সম্ভাব্য প্রশ্ন]\n` + studyResult.examStudyTips.map((tip, i) => `• ${tip}`).join('\n') : ''}
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotebookAction = () => {
    if (!studyResult || !onSaveToNotebook) return;
    const content = `### ${studyResult.title}
**ভাষা:** ${selectedLang.toUpperCase()} | **বিষয়:** ${contentTitle || url || 'ডকুমেন্ট/লিংক'}

#### সারসংক্ষেপ
${studyResult.overview}

#### বিস্তারিত একাডেমিক ব্যাখ্যা
${studyResult.detailedExplanation}

${studyResult.keyPoints?.length ? `#### মূল পয়েন্ট\n` + studyResult.keyPoints.map((p) => `- ${p}`).join('\n') : ''}
${studyResult.realWorldExamples?.length ? `#### বাস্তব উদাহরণ\n` + studyResult.realWorldExamples.map((ex) => `- ${ex}`).join('\n') : ''}
${studyResult.examStudyTips?.length ? `#### পরীক্ষার টিপস\n` + studyResult.examStudyTips.map((tip) => `- ${tip}`).join('\n') : ''}
`;
    onSaveToNotebook(studyResult.title, content, ['স্টাডি নোট', selectedLang, 'সামারি ও ব্যাখ্যা']);
    setSavedToNotebookSuccess(true);
    setTimeout(() => setSavedToNotebookSuccess(false), 2500);
  };

  const handleDownload = () => {
    if (!studyResult) return;
    const text = `${studyResult.title}
উৎস: ${contentTitle || url || 'ডকুমেন্ট/লিংক স্টাডি নোট'}
ভাষা: ${selectedLang}
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

=========================================
১. মূল সারসংক্ষেপ (Overview)
=========================================
${studyResult.overview}

=========================================
২. বিস্তারিত ব্যাখ্যা (In-Depth Explanation)
=========================================
${studyResult.detailedExplanation}

${studyResult.keyPoints?.length ? `\n=========================================\n৩. গুরুত্বপূর্ণ পয়েন্টসমূহ (Key Takeaways)\n=========================================\n` + studyResult.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : ''}

${studyResult.realWorldExamples?.length ? `\n=========================================\n৪. বাস্তব উদাহরণ ও সাদৃশ্য (Real-World Examples)\n=========================================\n` + studyResult.realWorldExamples.map((ex, i) => `[উদাহরণ ${i + 1}] ${ex}`).join('\n\n') : ''}

${studyResult.vocabularyAndTerms?.length ? `\n=========================================\n৫. পরিভাষা ও কঠিন শব্দার্থ (Vocabulary)\n=========================================\n` + studyResult.vocabularyAndTerms.map((t) => `• ${t.term}: ${t.meaning} ${t.explanation ? `(${t.explanation})` : ''}`).join('\n') : ''}

${studyResult.examStudyTips?.length ? `\n=========================================\n৬. পরীক্ষার প্রস্তুতি ও সম্ভাব্য প্রশ্ন (Exam Prep)\n=========================================\n` + studyResult.examStudyTips.map((tip) => `• ${tip}`).join('\n') : ''}
`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `Study_Notes_${selectedLang}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleSpeak = () => {
    if (!studyResult) return;
    setIsSpeaking(true);
    const speakable = `${studyResult.title}. ${studyResult.overview}. ${studyResult.detailedExplanation.slice(0, 500)}`;
    speakText(speakable, selectedLang);
    setTimeout(() => setIsSpeaking(false), 6000);
  };

  const sampleQuestions = [
    { label: '💡 বাস্তব উদাহরণসহ ব্যাখ্যা করো', query: 'কঠিন তত্ত্বগুলো সহজ বাস্তব উদাহরণ এবং উপমা দিয়ে বুঝিয়ে দাও।' },
    { label: '📝 সহজ ৩ লাইনে সামারাইজ করো', query: 'সহজ কথায় মূল নির্যাস ৩-৪ লাইনে সংক্ষেপে সামারাইজ করে দাও।' },
    { label: '🎓 সেমিস্টার পরীক্ষায় কী প্রশ্ন আসতে পারে?', query: 'এই টপিক থেকে বিশ্ববিদ্যালয় পরীক্ষায় সম্ভাব্য কী কী প্রশ্ন আসতে পারে এবং কীভাবে উত্তর দেবো?' },
    { label: '🔍 কঠিন পরিভাষার সহজ অর্থ কী?', query: 'এখানকার কঠিন একাডেমিক শব্দ ও পরিভাষাগুলোর অর্থ সহজ বাংলায় ভেঙে বুঝিয়ে দাও।' },
  ];

  return (
    <div className="mt-8 border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 via-white to-white rounded-2xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-bengali">
                🎓 AI স্টাডি টিউটর: বহুভাষিক সামারি ও গভীর ব্যাখ্যা
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                বিশ্ববিদ্যালয় স্টাডি গাইড
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bengali mt-0.5">
              যেকোনো PDF, Word বা URL লিংক থেকে বাংলা, ইংরেজি বা উর্দুতে সামারাইজ করুন ও বিস্তারিত ব্যাখ্যা জেনে নিন।
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title={isExpanded ? 'সংকুচিত করুন' : 'প্রসারিত করুন'}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-5">
          {/* Target Language Selection Bar */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-700 font-bengali flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                সামারি ও ব্যাখ্যা যে ভাষায় চান:
              </span>
              <span className="text-[11px] text-indigo-600 font-medium font-bengali">
                নির্বাচিত ভাষা: {languages.find((l) => l.code === selectedLang)?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {languages.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-2xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold leading-tight">{lang.label}</div>
                      <div className="text-[10px] text-slate-500">{lang.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* 1. Summarize */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecute('summarize', 'academic')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 to-white hover:from-emerald-100/70 hover:to-emerald-50 text-left transition-all group disabled:opacity-60"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 font-bengali">
                    {selectedLang === 'en'
                      ? 'Summarize in English'
                      : selectedLang === 'ur'
                      ? 'اردو میں خلاصہ کریں'
                      : selectedLang === 'ar'
                      ? 'تلخيص باللغة العربية'
                      : 'বাংলায় সামারাইজ করুন'}
                  </div>
                  <div className="text-xs text-slate-500 font-bengali">
                    মূল নির্যাস ও প্রধান পয়েন্ট
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-600 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
            </button>

            {/* 2. Deep Explanation */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecute('explain', 'academic')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-white hover:from-indigo-100/70 hover:to-indigo-50 text-left transition-all group disabled:opacity-60"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 font-bengali">
                    {selectedLang === 'en'
                      ? 'Explain in Detail'
                      : selectedLang === 'ur'
                      ? 'مکمل وضاحت اور تشریح'
                      : selectedLang === 'ar'
                      ? 'شرح مفصل وموسع'
                      : 'আরও ব্যাখ্যা করে বুঝিয়ে দাও'}
                  </div>
                  <div className="text-xs text-slate-500 font-bengali">
                    তত্ত্ব, যুক্তি ও গভীর বিশ্লেষণ
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-600 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
            </button>

            {/* 3. Real-world Examples & Exam Tips */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleExecute('explain', 'examples')}
              className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/70 to-white hover:from-amber-100/70 hover:to-amber-50 text-left transition-all group disabled:opacity-60 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 font-bengali">
                    {selectedLang === 'en'
                      ? 'Real-World Examples & Prep'
                      : selectedLang === 'ur'
                      ? 'مثالیں اور امتحانی نکات'
                      : selectedLang === 'ar'
                      ? 'أمثلة واقعية ونصائح دراسية'
                      : 'বাস্তব উদাহরণ ও পরীক্ষার প্রস্তুতি'}
                  </div>
                  <div className="text-xs text-slate-500 font-bengali">
                    সহজ উপমা ও সম্ভাব্য প্রশ্ন
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-amber-600 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Interactive Custom Query Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 font-bengali flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                ডকুমেন্ট বা লিংক নিয়ে আপনার নির্দিষ্ট প্রশ্ন বা চাহিদা:
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuestion.trim() && !isProcessing) {
                    handleExecute('interactive_query', 'academic');
                  }
                }}
                placeholder={
                  selectedLang === 'en'
                    ? "Ask anything about this document/link (e.g. 'Explain section 2 in simple terms')..."
                    : selectedLang === 'ur'
                    ? 'اس دستاویز یا لنک کے بارے میں کوئی بھی سوال پوچھیں...'
                    : 'যেমন: ৩ নম্বর প্যারাগ্রাফটি বুঝিয়ে দাও, বা সহজ উদাহরণ দিয়ে বলো...'
                }
                className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bengali placeholder:text-slate-400"
              />
              <button
                type="button"
                disabled={isProcessing || !customQuestion.trim()}
                onClick={() => handleExecute('interactive_query', 'academic')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 font-bengali"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">ব্যাখ্যা চাও</span>
                  </>
                )}
              </button>
            </div>

            {/* Sample Prompts */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCustomQuestion(q.query);
                    handleExecute('interactive_query', 'academic', q.query);
                  }}
                  disabled={isProcessing}
                  className="text-[11px] font-bengali px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-full text-slate-600 transition-colors disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center p-8 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mb-2.5" />
              <p className="text-sm font-semibold text-slate-800 font-bengali">
                AI স্টাডি টিউটর বিশ্লেষণ করছে ({languages.find((l) => l.code === selectedLang)?.label} ভাষায়)...
              </p>
              <p className="text-xs text-slate-500 font-bengali mt-1">
                তত্ত্ব, মূল সামারি, বাস্তব উদাহরণ ও কঠিন পরিভাষা প্রস্তুত হচ্ছে
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 font-bengali">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Result Card */}
          {studyResult && !isProcessing && (
            <div
              ref={resultContainerRef}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
            >
              {/* Result Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
                    {languages.find((l) => l.code === selectedLang)?.flag}{' '}
                    {studyResult.actionType === 'summarize'
                      ? 'সারসংক্ষেপ (Summary)'
                      : studyResult.actionType === 'explain'
                      ? 'গভীর ব্যাখ্যা (In-Depth Explanation)'
                      : 'উত্তর ও বিশ্লেষণ'}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 font-bengali">
                    {studyResult.title}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSpeak}
                    disabled={isSpeaking}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="পড়ে শোনান"
                  >
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-indigo-600' : ''}`} />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="কপি করুন"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {onSaveToNotebook && (
                    <button
                      onClick={handleSaveToNotebookAction}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="নোটবুকে সেভ করুন"
                    >
                      {savedToNotebookSuccess ? (
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <BookmarkPlus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="ডাউনলোড (.txt)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 1. Overview */}
              <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100/60">
                <div className="text-xs font-bold text-indigo-900 font-bengali uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  মূল নির্যাস / সারসংক্ষেপ (Executive Overview):
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-bengali whitespace-pre-line">
                  {studyResult.overview}
                </p>
              </div>

              {/* 2. Detailed Explanation */}
              <div>
                <div className="text-xs font-bold text-slate-800 font-bengali uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  তাত্ত্বিক বিশ্লেষণ ও গভীর ব্যাখ্যা (In-Depth Explanation):
                </div>
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-bengali whitespace-pre-line">
                  {studyResult.detailedExplanation}
                </div>
              </div>

              {/* 3. Key Points */}
              {studyResult.keyPoints && studyResult.keyPoints.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-800 font-bengali uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    গুরুত্বপূর্ণ পয়েন্টসমূহ (Key Takeaways):
                  </div>
                  <div className="space-y-1.5">
                    {studyResult.keyPoints.map((point, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50/40 border border-emerald-100/60 text-xs sm:text-sm text-slate-800 font-bengali"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="leading-snug">{point}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Real-World Examples */}
              {studyResult.realWorldExamples && studyResult.realWorldExamples.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-amber-800 font-bengali uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    বাস্তব উদাহরণ ও উপমা (Real-World Examples & Analogies):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {studyResult.realWorldExamples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-amber-50/40 border border-amber-200/60 text-xs sm:text-sm text-amber-950 font-bengali leading-relaxed"
                      >
                        <span className="font-bold text-amber-800 mr-1.5">💡 উদাহরণ {i + 1}:</span>
                        {ex}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Demystified Vocabulary / Jargon */}
              {studyResult.vocabularyAndTerms && studyResult.vocabularyAndTerms.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-slate-800 font-bengali uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    কঠিন পরিভাষা ও শব্দার্থ ব্যাংক (Demystified Vocabulary):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {studyResult.vocabularyAndTerms.map((v, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs text-xs font-bengali"
                      >
                        <div className="font-bold text-indigo-900">{v.term}</div>
                        <div className="text-emerald-700 font-medium text-[11px] mt-0.5">
                          {v.meaning}
                        </div>
                        {v.explanation && (
                          <div className="text-slate-500 text-[10px] mt-1 leading-normal">
                            {v.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Exam Study Tips */}
              {studyResult.examStudyTips && studyResult.examStudyTips.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-violet-800 font-bengali uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-violet-600" />
                    পরীক্ষার প্রস্তুতি ও সম্ভাব্য প্রশ্ন (Exam Prep & High-Yield Tips):
                  </div>
                  <div className="space-y-1.5">
                    {studyResult.examStudyTips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-50/40 border border-violet-100 text-xs sm:text-sm text-violet-950 font-bengali leading-relaxed"
                      >
                        <span className="text-violet-600 font-bold shrink-0">🎯</span>
                        <div>{tip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Suggested Follow-up Questions */}
              {studyResult.suggestedFollowUpQuestions &&
                studyResult.suggestedFollowUpQuestions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-xs font-semibold text-slate-500 font-bengali mb-1.5">
                      পরবর্তী প্রশ্ন করার পরামর্শ:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {studyResult.suggestedFollowUpQuestions.map((sq, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={isProcessing}
                          onClick={() => {
                            setCustomQuestion(sq);
                            handleExecute('interactive_query', 'academic', sq);
                          }}
                          className="text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/70 rounded-full px-3 py-1 font-bengali transition-colors"
                        >
                          💬 {sq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
