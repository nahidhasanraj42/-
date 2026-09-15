import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Volume2,
  Copy,
  Check,
  BookmarkPlus,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  MessageSquare,
  BookOpen,
  History,
  Zap,
  Radio,
  Sliders
} from 'lucide-react';
import { DetectedInClassQuestion } from '../types';
import { speakText } from '../utils/audioUtils';
import { useBackHandler, backNavigation } from '../utils/backNavigation';

interface AutoQuestionAnswerPopupProps {
  currentQuestion: DetectedInClassQuestion | null;
  questionHistory: DetectedInClassQuestion[];
  isOpen: boolean;
  onClose: () => void;
  onSaveToNotebook?: (title: string, content: string, tags: string[]) => void;
  contextText?: string;
  sourceType: 'lecture' | 'conversation';
}

export const AutoQuestionAnswerPopup: React.FC<AutoQuestionAnswerPopupProps> = ({
  currentQuestion,
  questionHistory,
  isOpen,
  onClose,
  onSaveToNotebook,
  contextText = '',
  sourceType,
}) => {
  const [activeQuestion, setActiveQuestion] = useState<DetectedInClassQuestion | null>(currentQuestion);
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed' | 'speaker_lang'>('quick');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [answerStyle, setAnswerStyle] = useState<'quick' | 'detailed' | 'simple' | 'academic'>('quick');

  // Sync with incoming new question
  useEffect(() => {
    if (currentQuestion) {
      setActiveQuestion(currentQuestion);
      setIsSaved(false);
      // Default to quick answer for immediate in-class response
      setActiveTab('quick');
    }
  }, [currentQuestion]);

  // Device & Browser Back Button support: Closes sub-views or popup
  useBackHandler(
    () => {
      if (showHistory) {
        setShowHistory(false);
        return true;
      }
      if (showManualInput) {
        setShowManualInput(false);
        return true;
      }
      onClose();
      return true;
    },
    100, // Highest priority overlay
    isOpen && !!activeQuestion,
    'qa-popup'
  );

  if (!isOpen || !activeQuestion) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSpeak = (text: string, lang: string = 'bn') => {
    // If pre-rendered base64 audio exists and language matches, use it
    if (activeQuestion.audioBase64 && lang !== 'bn') {
      const audio = new Audio(`data:audio/wav;base64,${activeQuestion.audioBase64}`);
      audio.play().catch(() => speakText(text, lang));
    } else {
      speakText(text, lang);
    }
  };

  const handleSave = () => {
    if (!onSaveToNotebook || !activeQuestion) return;
    const title = `প্রশ্নোত্তর: ${activeQuestion.translatedQuestion.slice(0, 60)}...`;
    const content = `**প্রশ্ন (${activeQuestion.detectedLanguage}):**\n${activeQuestion.originalQuestion}\n\n**বাংলা প্রশ্ন:**\n${activeQuestion.translatedQuestion}\n\n**তাত্ক্ষণিক উত্তর:**\n${activeQuestion.quickAnswer}\n\n**বিস্তারিত একাডেমিক ব্যাখ্যা:**\n${activeQuestion.detailedAnswer}\n\n**প্রফেসরের ভাষায় উত্তর:**\n${activeQuestion.answerInSpeakerLang || '—'}\n\n**উচ্চারণ:**\n${activeQuestion.transliterationSpeakerLang || '—'}`;
    onSaveToNotebook(title, content, ['প্রশ্নোত্তর', activeQuestion.source, activeQuestion.detectedLanguage]);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Regenerate answer with different style or custom question
  const handleRegenerate = async (customQuestion?: string, chosenStyle?: 'quick' | 'detailed' | 'simple' | 'academic') => {
    const qText = customQuestion || activeQuestion.originalQuestion || activeQuestion.translatedQuestion;
    if (!qText.trim()) return;

    const style = chosenStyle || answerStyle;
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/qa/auto-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          context: contextText,
          speakerLanguage: activeQuestion.detectedLanguage || 'auto',
          targetSpeakerLanguage: activeQuestion.detectedLanguage?.toLowerCase().includes('ar') ? 'ar' : activeQuestion.detectedLanguage?.toLowerCase().includes('ur') ? 'ur' : 'en',
          answerStyle: style,
        }),
      });

      if (!res.ok) throw new Error('উত্তর পুনর্জেনারেট করা সম্ভব হয়নি।');
      const data = await res.json();

      setActiveQuestion({
        ...activeQuestion,
        originalQuestion: data.questionOriginal || activeQuestion.originalQuestion,
        translatedQuestion: data.questionTranslatedBn || activeQuestion.translatedQuestion,
        quickAnswer: data.quickAnswerBn,
        detailedAnswer: data.detailedAnswerBn,
        answerInSpeakerLang: data.answerInSpeakerLang,
        transliterationSpeakerLang: data.transliterationSpeakerLang,
        keyConcepts: data.keyConcepts || activeQuestion.keyConcepts,
        audioBase64: data.audioBase64 || activeQuestion.audioBase64,
      });

      if (customQuestion) {
        setManualInput('');
        setShowManualInput(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'উত্তর তৈরিতে ত্রুটি হয়েছে।');
    } finally {
      setIsRegenerating(false);
    }
  };

  const isLecture = sourceType === 'lecture';

  return (
    <div
      id="auto-qa-popup-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="auto-qa-popup-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-950 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 px-5 py-3.5 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">
                  {isLecture ? 'ক্লাসরুম প্রশ্ন' : 'কথোপকথন প্রশ্ন'}
                </span>
                <span className="text-xs text-indigo-100 font-medium">
                  {activeQuestion.timeFormatted ? `টাইমস্ট্যাম্প: ${activeQuestion.timeFormatted}` : activeQuestion.speakerLabel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isLecture ? '🚨 প্রফেসরের প্রশ্ন শনাক্ত হয়েছে!' : '❓ অপর পক্ষ প্রশ্ন করেছে!'}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {questionHistory.length > 1 && (
              <button
                id="toggle-question-history-btn"
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition ${
                  showHistory ? 'bg-white text-indigo-700' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title="পূর্ববর্তী প্রশ্নসমূহ"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ইতিহাস ({questionHistory.length})</span>
              </button>
            )}

            <button
              id="close-auto-qa-popup-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
              title="পপআপ বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Question History Drawer if open */}
          {showHistory && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  📋 এই ক্লাসে প্রফেসরের পূর্ববর্তী প্রশ্নসমূহ:
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  লুকান
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {questionHistory.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setActiveQuestion(q);
                      setShowHistory(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border transition ${
                      activeQuestion.id === q.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                      <span>{q.timeFormatted || q.speakerLabel}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{q.detectedLanguage}</span>
                    </div>
                    <div className="truncate">{q.translatedQuestion || q.originalQuestion}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Captured Question Display Box */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
              <span className="flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>শনাক্তকৃত মূল প্রশ্ন ({activeQuestion.detectedLanguage || 'ভাষ্য'}):</span>
              </span>
              <button
                onClick={() => handleCopy(activeQuestion.originalQuestion, 'orig_q')}
                className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline flex items-center space-x-0.5"
              >
                {copiedField === 'orig_q' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'orig_q' ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 font-serif leading-relaxed">
              "{activeQuestion.originalQuestion}"
            </p>

            {activeQuestion.translatedQuestion && activeQuestion.translatedQuestion !== activeQuestion.originalQuestion && (
              <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">সহজ বাংলায় অর্থ:</span>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {activeQuestion.translatedQuestion}
                </p>
              </div>
            )}
          </div>

          {/* Answer Style Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>AI প্রস্তুতকৃত স্বয়ংক্রিয় উত্তর:</span>
              </span>

              {/* Style selector pills */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
                <button
                  id="tab-quick-answer"
                  onClick={() => setActiveTab('quick')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'quick'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  ⚡ তাত্ক্ষণিক উত্তর
                </button>
                <button
                  id="tab-detailed-answer"
                  onClick={() => setActiveTab('detailed')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    activeTab === 'detailed'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  📚 একাডেমিক ব্যাখ্যা
                </button>
                {activeQuestion.answerInSpeakerLang && (
                  <button
                    id="tab-speaker-lang-answer"
                    onClick={() => setActiveTab('speaker_lang')}
                    className={`px-2.5 py-1 rounded-md font-medium transition ${
                      activeTab === 'speaker_lang'
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    🗣️ প্রফেসরের ভাষায়
                  </button>
                )}
              </div>
            </div>

            {/* Tab 1: Quick Answer (for raising hand and speaking in class immediately) */}
            {activeTab === 'quick' && (
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>তাত্ক্ষণিক মুখে বলার উত্তর (ক্লাসে হাত তুলে বলার জন্য):</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSpeak(activeQuestion.quickAnswer, 'bn')}
                      className="p-1 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded transition"
                      title="উচ্চারণ শুনুন"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(activeQuestion.quickAnswer, 'quick_ans')}
                      className="text-[11px] text-indigo-700 dark:text-indigo-300 hover:underline flex items-center space-x-0.5"
                    >
                      {copiedField === 'quick_ans' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'quick_ans' ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-base font-semibold text-indigo-950 dark:text-indigo-100 leading-relaxed">
                  {activeQuestion.quickAnswer}
                </p>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 italic">
                  💡 টিপস: এই ১-২ লাইনের উত্তরটি দিয়ে প্রফেসরের দৃষ্টি আকর্ষণ করুন।
                </div>
              </div>
            )}

            {/* Tab 2: Detailed Academic Explanation */}
            {activeTab === 'detailed' && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>বিশদ তাত্ত্বিক ব্যাখ্যা ও পয়েন্টসমূহ:</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSpeak(activeQuestion.detailedAnswer, 'bn')}
                      className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded transition"
                      title="পড়ে শোনান"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(activeQuestion.detailedAnswer, 'detail_ans')}
                      className="text-[11px] text-slate-600 dark:text-slate-300 hover:underline flex items-center space-x-0.5"
                    >
                      {copiedField === 'detail_ans' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'detail_ans' ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {activeQuestion.detailedAnswer}
                </div>
              </div>
            )}

            {/* Tab 3: Spoken Answer in Teacher's/Speaker's Original Language */}
            {activeTab === 'speaker_lang' && activeQuestion.answerInSpeakerLang && (
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    <span>প্রফেসরের ভাষায় উত্তর (যাতে সরাসরি বলতে পারেন):</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleSpeak(
                          activeQuestion.answerInSpeakerLang!,
                          activeQuestion.detectedLanguage?.toLowerCase().includes('ar')
                            ? 'ar'
                            : activeQuestion.detectedLanguage?.toLowerCase().includes('ur')
                            ? 'ur'
                            : 'en'
                        )
                      }
                      className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-medium flex items-center space-x-1 hover:bg-emerald-700 transition"
                      title="অডিও প্লেব্যাক"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>উচ্চারণ শুনুন</span>
                    </button>
                    <button
                      onClick={() => handleCopy(activeQuestion.answerInSpeakerLang!, 'speaker_ans')}
                      className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline flex items-center space-x-0.5"
                    >
                      {copiedField === 'speaker_ans' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'speaker_ans' ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-base sm:text-lg font-medium text-emerald-950 dark:text-emerald-100 font-serif leading-relaxed">
                  {activeQuestion.answerInSpeakerLang}
                </p>

                {activeQuestion.transliterationSpeakerLang && (
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-200/70 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-semibold">সহজ উচ্চারণ নির্দেশিকা: </span>
                    <span className="italic">{activeQuestion.transliterationSpeakerLang}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Key Concepts Pills if present */}
          {activeQuestion.keyConcepts && activeQuestion.keyConcepts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">সম্পর্কিত ধারণা:</span>
              {activeQuestion.keyConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {concept}
                </span>
              ))}
            </div>
          )}

          {/* Style Modifiers & Refinement Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">অন্য আঙ্গিকে উত্তর:</span>
              <button
                disabled={isRegenerating}
                onClick={() => handleRegenerate(undefined, 'simple')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-[11px]"
              >
                🌱 আরও সহজ ভাষায়
              </button>
              <button
                disabled={isRegenerating}
                onClick={() => handleRegenerate(undefined, 'academic')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-[11px]"
              >
                🎓 সেমিস্টার পরীক্ষার মানদণ্ডে
              </button>
            </div>

            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{showManualInput ? 'প্রশ্ন বক্স বন্ধ' : 'নিজে প্রশ্ন লিখুন'}</span>
            </button>
          </div>

          {/* Optional Manual Question Entry if speech was missed */}
          {showManualInput && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="টিচার অন্য কী প্রশ্ন করেছেন লিখুন..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRegenerate(manualInput);
                }}
              />
              <button
                disabled={isRegenerating || !manualInput.trim()}
                onClick={() => handleRegenerate(manualInput)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center space-x-1"
              >
                {isRegenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>উত্তর নিন</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onSaveToNotebook && (
              <button
                id="save-qa-to-notebook-btn"
                onClick={handleSave}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                }`}
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-white" /> : <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{isSaved ? 'নোটবুকে সেভ হয়েছে!' : 'নোটবুকে সেভ করুন'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-xs"
            >
              বুঝেছি / বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
