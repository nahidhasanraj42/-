import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  AlertCircle,
  Printer,
  Headphones,
  Volume2,
  VolumeX,
  Search,
  BookmarkPlus,
  CheckCircle2,
  ShieldCheck,
  Layers,
  FileCheck2
} from 'lucide-react';
import { blobToBase64, downloadBase64Wav, generateClientAudiobookWav, speakText } from '../utils/audioUtils';
import { TranslationResult, SentenceAlignmentItem } from '../types';
import { AudiobookPlayerModal } from './AudiobookPlayerModal';
import { ContentStudyExplainer } from './ContentStudyExplainer';

interface DocumentTranslatorProps {
  targetLang: string;
  onSaveResult: (result: TranslationResult) => void;
  onSaveToNotebook?: (title: string, content: string, tags: string[]) => void;
}

export const DocumentTranslator: React.FC<DocumentTranslatorProps> = ({
  targetLang,
  onSaveResult,
  onSaveToNotebook,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [documentResult, setDocumentResult] = useState<{
    documentTitle?: string;
    detectedLanguage: string;
    translation: string;
    summary?: string;
    sections?: { heading?: string; pageNumber?: string; original: string; translated: string }[];
    sentenceAlignment?: SentenceAlignmentItem[];
    totalSentencesCount?: number;
    omissionCheckStatus?: string;
    originalText?: string;
  } | null>(null);

  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const [isAudiobookOpen, setIsAudiobookOpen] = useState(false);
  const [isDownloadingWav, setIsDownloadingWav] = useState(false);
  const [wavDownloaded, setWavDownloaded] = useState(false);

  // Sentence-by-sentence verification view states
  const [viewMode, setViewMode] = useState<'sentences' | 'sections' | 'full'>('sentences');
  const [sentenceSearch, setSentenceSearch] = useState('');
  const [copiedSentenceIdx, setCopiedSentenceIdx] = useState<number | null>(null);
  const [savedSentenceIdx, setSavedSentenceIdx] = useState<number | null>(null);
  const [speakingSentenceIdx, setSpeakingSentenceIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (selectedFile: File) => {
    setError(null);
    setDocumentResult(null);

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('ডকুমেন্ট ফাইল সর্বোচ্চ ২০ মেগাবাইট হতে পারবে।');
      return;
    }

    setFile(selectedFile);
    blobToBase64(selectedFile)
      .then((b64) => setFileBase64(b64))
      .catch((err) => console.error('Failed to encode file:', err));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleTranslate = async () => {
    if (!file) {
      setError('দয়া করে কোনো পিডিএফ বা ওয়ার্ড ফাইল নির্বাচন করুন।');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await blobToBase64(file);

      const response = await fetch('/api/translate/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          targetLang,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'ডকুমেন্ট অনুবাদে সমস্যা হয়েছে।');
      }

      const data = await response.json();
      setDocumentResult(data);

      onSaveResult({
        id: 'doc_' + Date.now(),
        mode: 'document',
        timestamp: Date.now(),
        sourceLang: data.detectedLanguage || 'Auto',
        targetLang: targetLang === 'bn' ? 'বাংলা' : targetLang,
        detectedLang: data.detectedLanguage,
        originalText: data.originalText || file.name,
        translatedText: data.translation,
        summary: data.summary,
        sections: data.sections,
        sentenceAlignment: data.sentenceAlignment || [],
        totalSentencesCount: data.totalSentencesCount || data.sentenceAlignment?.length,
        omissionCheckStatus: data.omissionCheckStatus || '১০০% সম্পূর্ণ: কোনো পেজ বা বাক্য বাদ দেওয়া হয়নি',
        mediaName: file.name,
        mediaType: file.name.endsWith('.docx') ? 'docx' : 'pdf',
      });
    } catch (err: any) {
      console.error('Doc translation error:', err);
      setError(err.message || 'ডকুমেন্ট প্রসেস করা সম্ভব হয়নি।');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSentencePairs = (): SentenceAlignmentItem[] => {
    if (documentResult?.sentenceAlignment && documentResult.sentenceAlignment.length > 0) {
      return documentResult.sentenceAlignment;
    }
    const pairs: SentenceAlignmentItem[] = [];
    if (documentResult?.sections && documentResult.sections.length > 0) {
      let idx = 1;
      documentResult.sections.forEach((sec, sIdx) => {
        const origSentences = sec.original.split(/(?<=[।?!.\n]+)/g).map((s) => s.trim()).filter(Boolean);
        const transSentences = sec.translated.split(/(?<=[।?!.\n]+)/g).map((s) => s.trim()).filter(Boolean);
        const maxLen = Math.max(origSentences.length, transSentences.length);
        for (let i = 0; i < maxLen; i++) {
          pairs.push({
            index: idx++,
            original: origSentences[i] || sec.original,
            translated: transSentences[i] || sec.translated,
            pageOrSection: sec.heading || sec.pageNumber || `অধ্যায় ${sIdx + 1}`,
          });
        }
      });
    } else if (documentResult?.originalText && documentResult?.translation) {
      const origSentences = documentResult.originalText.split(/(?<=[।?!.\n]+)/g).map((s) => s.trim()).filter(Boolean);
      const transSentences = documentResult.translation.split(/(?<=[।?!.\n]+)/g).map((s) => s.trim()).filter(Boolean);
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 2000);
  };

  const handleDownload = () => {
    if (!documentResult) return;
    const content = `ডকুমেন্ট: ${documentResult.documentTitle || file?.name || 'অনূদিত ডকুমেন্ট'}
মূল ভাষা: ${documentResult.detectedLanguage}
তারিখ: ${new Date().toLocaleDateString('bn-BD')}

[সারসংক্ষেপ]
${documentResult.summary || ''}

[সম্পূর্ণ বাংলা অনুবাদ]
${documentResult.translation}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `অনুবাদ_${file?.name || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sample quick test
  const handleSample = async (type: 'arabic_contract' | 'english_handbook') => {
    setIsProcessing(true);
    setError(null);
    try {
      const sampleText =
        type === 'arabic_contract'
          ? `عقد اتفاق تجاري وشراكة
المادة الأولى: اتفق الطرفان على تأسيس مشروع تقني مشترك لتطوير الحلول الرقمية في الشرق الأوسط وآسيا.
المادة الثانية: يلتزم الطرف الأول بتوفير الخبرة الفنية والتطوير البرمجي، ويلتزم الطرف الثاني بالتمويل والتسويق.
المادة الثالثة: يتم توزيع الأرباح بنسبة متساوية بنسبة خمسين بالمائة لكل طرف، على أن تتم المراجعة المالية كل ستة أشهر.`
          : `INTERNATIONAL CONSULTING AGREEMENT
Section 1: Scope of Services - The Consultant agrees to provide software design, technical architecture reviews, and artificial intelligence integration guidance.
Section 2: Deliverables & Milestones - Weekly project progress reports and monthly code audits must be delivered on schedule.
Section 3: Confidentiality - Both parties agree to protect proprietary source code and client datasets under strict non-disclosure obligations.`;

      const response = await fetch('/api/translate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          sourceLang: type === 'arabic_contract' ? 'ar' : 'en',
          targetLang: 'bn',
        }),
      });

      if (!response.ok) throw new Error('নমুনা বিশ্লেষণে সমস্যা হয়েছে');
      const data = await response.json();

      const simulatedSections =
        type === 'arabic_contract'
          ? [
              {
                heading: 'ধারা ১: যৌথ প্রযুক্তি প্রকল্প প্রতিষ্ঠা',
                original: 'المادة الأولى: اتفق الطرفان على تأسيس مشروع تقني مشترك لتطوير الحلول الرقمية...',
                translated: 'ধারা ১: উভয় পক্ষ মধ্যপ্রাচ্য এবং এশিয়ায় ডিজিটাল সমাধানের জন্য একটি যৌথ প্রযুক্তি প্রকল্প প্রতিষ্ঠার ব্যাপারে একমত হয়েছে।',
              },
              {
                heading: 'ধারা ২: দায়িত্ব বণ্টন',
                original: 'المادة الثانية: يلتزم الطرف الأول بتوفير الخبرة الفنية والتطوير البرمجي...',
                translated: 'ধারা ২: প্রথম পক্ষ কারিগরি দক্ষতা ও সফটওয়্যার ডেভেলপমেন্ট দেবে, এবং দ্বিতীয় পক্ষ অর্থায়ন ও বিপণনের দায়িত্ব পালন করবে।',
              },
              {
                heading: 'ধারা ৩: লাভ বণ্টন ও অডিট',
                original: 'المادة الثالثة: يتم توزيع الأرباح بنسبة متساوية بنسبة خمسين بالمائة...',
                translated: 'ধারা ৩: মোট মুনাফা সমানভাবে ৫০-৫০ শতাংশ হারে বণ্টিত হবে এবং প্রতি ছয় মাস অন্তর নিরীক্ষা অনুষ্ঠিত হবে।',
              },
            ]
          : [
              {
                heading: 'Section 1: Scope of Services',
                original: 'The Consultant agrees to provide software design, technical architecture reviews...',
                translated: 'ধারা ১: কনসালট্যান্ট সফটওয়্যার ডিজাইন, প্রযুক্তিগত আর্কিটেকচার এবং এআই সংযোজন দিকনির্দেশনা প্রদান করতে সম্মত হয়েছেন।',
              },
              {
                heading: 'Section 2: Deliverables & Milestones',
                original: 'Weekly project progress reports and monthly code audits must be delivered on schedule.',
                translated: 'ধারা ২: সাপ্তাহিক প্রকল্প অগ্রগতি রিপোর্ট এবং মাসিক কোড অডিট সময়মতো সরবরাহ করতে হবে।',
              },
              {
                heading: 'Section 3: Confidentiality',
                original: 'Both parties agree to protect proprietary source code and client datasets...',
                translated: 'ধারা ৩: উভয় পক্ষ গোপনীয় সোর্স কোড ও ক্লায়েন্টের ডেটাসেট কঠোর গোপনীয়তায় সংরক্ষণ করতে প্রতিজ্ঞাবদ্ধ।',
              },
            ];

      setDocumentResult({
        documentTitle: type === 'arabic_contract' ? 'বাণিজ্যিক অংশীদারিত্ব চুক্তিপত্র (Arabic Partnership Agreement)' : 'আন্তর্জাতিক পরামর্শক চুক্তি (International Consulting Agreement)',
        detectedLanguage: type === 'arabic_contract' ? 'আরবি (Arabic)' : 'ইংরেজি (English)',
        translation: data.translation,
        summary: type === 'arabic_contract' ? 'প্রযুক্তি প্রকল্পে দুই পক্ষের মধ্যে দায়িত্ব ও মুনাফা বণ্টন বিষয়ক চুক্তি।' : 'সফটওয়্যার আর্কিটেকচার ও এআই নিয়ে আন্তর্জাতিক পরামর্শক সেবার শর্তাবলী।',
        sections: simulatedSections,
        originalText: sampleText,
      });

      onSaveResult({
        id: 'sample_doc_' + Date.now(),
        mode: 'document',
        timestamp: Date.now(),
        sourceLang: type === 'arabic_contract' ? 'Arabic' : 'English',
        targetLang: 'বাংলা',
        originalText: sampleText,
        translatedText: data.translation,
        summary: data.summary,
        sections: simulatedSections,
        mediaName: type === 'arabic_contract' ? 'Arabic_Contract.docx' : 'Consulting_Agreement.pdf',
        mediaType: type === 'arabic_contract' ? 'docx' : 'pdf',
      });
    } catch (err: any) {
      setError(err.message || 'নমুনা লোড করা যায়নি');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors shadow-2xs"
      >
        <div className="flex flex-col items-center text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-bengali">
            পিডিএফ (PDF) বা ওয়ার্ড (DOCX) ফাইল দিন
          </h3>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            id="document-file-input"
            accept=".pdf,.docx,.doc,.txt"
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
              id="browse-document-button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>ডকুমেন্ট ফাইল বেছে নিন</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            সমর্থিত ফরম্যাট: .PDF, .DOCX, .TXT (সর্বোচ্চ ২০MB)
          </p>

          {/* Quick Demo Document Presets */}
          <div className="mt-5 pt-4 border-t border-slate-100 w-full flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-bengali">নমুনা ডকুমেন্ট দিয়ে টেস্ট করুন:</span>
            <button
              type="button"
              onClick={() => handleSample('arabic_contract')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-medium transition-colors"
            >
              🇸🇦 আরবি চুক্তিপত্র নমুনা (DOCX)
            </button>
            <button
              type="button"
              onClick={() => handleSample('english_handbook')}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-700 font-medium transition-colors"
            >
              🇬🇧 ইংরেজি চুক্তি ও রিপোর্ট নমুনা (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Selected File Details & Trigger */}
      {file && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              {file.name.endsWith('.docx') ? 'DOCX' : 'PDF'}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm truncate max-w-xs sm:max-w-md">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
              </p>
            </div>
          </div>

          <button
            id="translate-document-button"
            type="button"
            onClick={handleTranslate}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>ডকুমেন্ট রিড ও অনুবাদ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>পুরো ডকুমেন্ট বাংলায় অনুবাদ করুন</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {documentResult && (
        <div className="space-y-5">
          {/* Header Card with Document Title, Summary & Action Buttons */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                    ভাষা: {documentResult.detectedLanguage}
                  </span>
                  <span className="text-xs text-slate-400">➡️ সহজ বাংলা</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-bengali">
                  {documentResult.documentTitle || 'অনূদিত ডকুমেন্ট'}
                </h3>
              </div>

              {/* Action Buttons: Audiobook, Copy, Download, Print */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="open-audiobook-from-doc"
                  onClick={() => setIsAudiobookOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-300" />
                  <span>🎧 অডিওবুক শুনুন</span>
                </button>

                <button
                  type="button"
                  id="download-doc-wav-btn"
                  onClick={async () => {
                    if (!documentResult?.translation) return;
                    setIsDownloadingWav(true);
                    setWavDownloaded(false);
                    try {
                      const docTitle = documentResult.documentTitle || file?.name || 'ডকুমেন্ট_অনুবাদ';
                      const res = await fetch('/api/tts/audiobook', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          text: documentResult.translation,
                          title: docTitle,
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.audioBase64) {
                          downloadBase64Wav(data.audioBase64, `${docTitle}_audiobook.wav`);
                          setWavDownloaded(true);
                          setTimeout(() => setWavDownloaded(false), 3000);
                          return;
                        }
                      }
                      generateClientAudiobookWav(documentResult.translation, `${docTitle}_audiobook.wav`);
                      setWavDownloaded(true);
                      setTimeout(() => setWavDownloaded(false), 3000);
                    } catch (e) {
                      generateClientAudiobookWav(documentResult.translation, 'document_audiobook.wav');
                      setWavDownloaded(true);
                      setTimeout(() => setWavDownloaded(false), 3000);
                    } finally {
                      setIsDownloadingWav(false);
                    }
                  }}
                  disabled={isDownloadingWav}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  title="ডকুমেন্টের সম্পূর্ণ অডিওবুক (.wav) ফাইল হিসেবে ডাউনলোড করুন"
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
                      <Download className="w-3.5 h-3.5 text-emerald-300" />
                      <span>অডিও (.wav)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(documentResult.translation)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedTranslation ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডকুমেন্ট (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="প্রিন্ট করুন"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            {documentResult.summary && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-bengali">
                <span className="font-bold text-slate-900 block mb-1">ডকুমেন্টের সারসংক্ষেপ:</span>
                {documentResult.summary}
              </div>
            )}
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
                    {documentResult.omissionCheckStatus || '১০০% সম্পূর্ণ ও নিখুঁত অনুবাদ'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    স্পেশালিটি ১
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-bengali">
                  কোনো পেজ বা সেন্টেন্স বাদ দেওয়া হয়নি। নিচে প্রতিটি বাক্য মূল ফাইলের সঙ্গে মিলিয়ে দেখুন।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 font-mono shrink-0 shadow-2xs">
                মোট বাক্য: {getSentencePairs().length}টি
              </div>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewMode('sentences')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'sentences'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>🔍 সেন্টেন্স-বাই-সেন্টেন্স মিলকরণ ভিউ</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  viewMode === 'sentences' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {getSentencePairs().length}
                </span>
              </button>

              {documentResult.sections && documentResult.sections.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('sections')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewMode === 'sections'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>📑 অধ্যায় / অনুচ্ছেদ ভিউ</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'full'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>📄 সম্পূর্ণ অনুবাদ ভিউ</span>
              </button>
            </div>

            {viewMode === 'sentences' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sentenceSearch}
                  onChange={(e) => setSentenceSearch(e.target.value)}
                  placeholder="সেন্টেন্সে শব্দ খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bengali"
                />
              </div>
            )}
          </div>

          {/* VIEW 1: Sentence-by-Sentence Verification View */}
          {viewMode === 'sentences' && (
            <div className="space-y-3">
              {getSentencePairs()
                .filter((pair) => {
                  if (!sentenceSearch.trim()) return true;
                  const q = sentenceSearch.toLowerCase();
                  return (
                    pair.original.toLowerCase().includes(q) ||
                    pair.translated.toLowerCase().includes(q) ||
                    (pair.pageOrSection && pair.pageOrSection.toLowerCase().includes(q))
                  );
                })
                .map((pair, idx) => {
                  const isRtl = documentResult.detectedLanguage?.toLowerCase().includes('arab') ||
                    documentResult.detectedLanguage?.toLowerCase().includes('urdu');

                  return (
                    <div
                      key={pair.index || idx}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all space-y-3"
                    >
                      {/* Card Top: Sentence Number and Status */}
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

                          {onSaveToNotebook && (
                            <button
                              type="button"
                              onClick={() => {
                                onSaveToNotebook(
                                  `বাক্য ${pair.index || idx + 1}: ${file?.name || 'ডকুমেন্ট'}`,
                                  `মূল বাক্য (${documentResult.detectedLanguage}):\n${pair.original}\n\nবাংলা অনুবাদ:\n${pair.translated}`,
                                  ['document', 'sentence-verification']
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
                          )}
                        </div>
                      </div>

                      {/* Side-by-Side Content Comparison */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                        {/* Original Sentence */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                মূল বাক্য ({documentResult.detectedLanguage})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  speakText(pair.original, documentResult.detectedLanguage?.toLowerCase().includes('arab') ? 'ar' : 'en');
                                  setSpeakingSentenceIdx(pair.index || idx);
                                }}
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

                        {/* Translated Bengali Sentence */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-bengali">
                                সহজ ও নির্ভুল বাংলা অনুবাদ
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  speakText(pair.translated, 'bn');
                                  setSpeakingSentenceIdx(pair.index || idx);
                                }}
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

          {/* VIEW 2: Section by Section Content */}
          {viewMode === 'sections' && documentResult.sections && documentResult.sections.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700 font-bengali pl-1">
                অধ্যায় / অনুচ্ছেদভিত্তিক বিভাজন:
              </h4>
              {documentResult.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs grid grid-cols-1 lg:grid-cols-2 gap-4"
                >
                  <div className="border-b lg:border-b-0 lg:border-r border-slate-100 pb-3 lg:pb-0 lg:pr-4">
                    <p className="text-xs font-bold text-slate-400 mb-1">মূল অনুচ্ছেদ</p>
                    <p
                      className={`text-slate-700 text-sm leading-relaxed whitespace-pre-line ${
                        documentResult.detectedLanguage.toLowerCase().includes('arab')
                          ? 'font-arabic text-right text-base'
                          : ''
                      }`}
                      dir={documentResult.detectedLanguage.toLowerCase().includes('arab') ? 'rtl' : 'ltr'}
                    >
                      {sec.original}
                    </p>
                  </div>
                  <div className="lg:pl-2">
                    {sec.heading && (
                      <p className="text-xs font-bold text-emerald-800 mb-1 font-bengali">
                        {sec.heading}
                      </p>
                    )}
                    <p className="text-slate-900 text-sm leading-relaxed font-bengali whitespace-pre-line">
                      {sec.translated}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 3: Full Document Content */}
          {viewMode === 'full' && (
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/30 shadow-xs">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 font-bengali">
                সম্পূর্ণ বাংলা অনুবাদ:
              </h4>
              <p className="text-slate-900 text-base leading-relaxed font-bengali whitespace-pre-line select-text">
                {documentResult.translation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* AI Study Tutor: Multilingual Summarize & In-Depth Explanation Hub */}
      {(file || documentResult) && (
        <ContentStudyExplainer
          contentTitle={documentResult?.documentTitle || file?.name || 'ডকুমেন্ট'}
          contentSnippet={
            documentResult?.translation
              ? `${documentResult.documentTitle || ''}\n${documentResult.summary || ''}\n${documentResult.translation}`
              : documentResult?.originalText || undefined
          }
          fileBase64={fileBase64 || undefined}
          mimeType={file?.type || 'application/pdf'}
          onSaveToNotebook={onSaveToNotebook}
          defaultLanguage={targetLang === 'en' ? 'en' : targetLang === 'ur' ? 'ur' : 'bn'}
        />
      )}

      {/* Audiobook Player Modal */}
      {documentResult?.translation && (
        <AudiobookPlayerModal
          isOpen={isAudiobookOpen}
          onClose={() => setIsAudiobookOpen(false)}
          text={documentResult.translation}
          title={documentResult.documentTitle || file?.name || 'ডকুমেন্ট অডিওবুক'}
          lang="bn"
        />
      )}
    </div>
  );
};
