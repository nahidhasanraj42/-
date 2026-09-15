import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Layers,
  Sparkles,
  FileCheck2,
  BookOpen
} from 'lucide-react';
import { TranslationResult } from '../types';
import { DocumentTranslator } from './DocumentTranslator';
import { ImageTranslator } from './ImageTranslator';
import { MediaTranslator } from './MediaTranslator';
import { useBackHandler } from '../utils/backNavigation';

interface UnifiedContentHubProps {
  targetLang: string;
  onSaveResult: (result: TranslationResult) => void;
  onSaveToNotebook?: (
    title: string,
    content: string,
    category?: any,
    originalText?: string
  ) => void;
  initialTab?: 'image' | 'document' | 'media';
}

export const UnifiedContentHub: React.FC<UnifiedContentHubProps> = ({
  targetLang,
  onSaveResult,
  onSaveToNotebook,
  initialTab = 'document',
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'document' | 'media'>(initialTab);

  // Allow back button to return to default tab if user switched tabs
  useBackHandler(
    () => {
      if (activeTab !== initialTab) {
        setActiveTab(initialTab);
        return true;
      }
      return false;
    },
    20,
    activeTab !== initialTab,
    'unified-content-hub-tab'
  );

  return (
    <div className="space-y-6">
      {/* Sleek Minimal Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-bengali text-white">
            ফাইল, ছবি ও লিংক অনুবাদ
          </h2>
        </div>

        {/* Sub-tab selection buttons */}
        <div className="flex flex-wrap sm:flex-nowrap bg-black/40 p-1.5 rounded-2xl border border-white/10 gap-1 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'document'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ডকুমেন্ট (PDF/Doc)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'image'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>ছবি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'media'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>লিংক ও ভিডিও</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar (Visual switchers) */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'document'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span className="font-bengali">পিডিএফ ও ওয়ার্ড ফাইল (.pdf, .docx)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'image'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span className="font-bengali">ছবি ও স্ক্রিনশট (OCR অনুবাদ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
              activeTab === 'media'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-emerald-700" />
            <span className="font-bengali">ইউটিউব / ওয়েব ইউআরএল ও মিডিয়া</span>
          </button>
        </div>
      </div>

      {/* Render Active Component */}
      <div className="transition-all duration-200">
        {activeTab === 'document' && (
          <DocumentTranslator
            targetLang={targetLang}
            onSaveResult={onSaveResult}
            onSaveToNotebook={
              onSaveToNotebook
                ? (title, content, tags) =>
                    onSaveToNotebook(title, content, 'study_notes')
                : undefined
            }
          />
        )}

        {activeTab === 'image' && (
          <ImageTranslator
            onTranslationComplete={onSaveResult}
            onSaveToNotebook={
              onSaveToNotebook
                ? (title, content, category, originalText) =>
                    onSaveToNotebook(title, content, category, originalText)
                : () => {}
            }
          />
        )}

        {activeTab === 'media' && (
          <MediaTranslator
            targetLang={targetLang}
            onSaveResult={onSaveResult}
            onSaveToNotebook={
              onSaveToNotebook
                ? (title, content, tags) =>
                    onSaveToNotebook(title, content, 'study_notes')
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};
