import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { SUPPORTED_LANGUAGES, TARGET_LANGUAGES } from '../languages';

interface LanguageSelectorProps {
  sourceLang: string;
  targetLang: string;
  onChangeSource: (code: string) => void;
  onChangeTarget: (code: string) => void;
  onSwapLanguages?: () => void;
  detectedLang?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLang,
  targetLang,
  onChangeSource,
  onChangeTarget,
  onSwapLanguages,
  detectedLang,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
      {/* Source Language Picker */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
          উৎস ভাষা:
        </span>
        <div className="relative flex-1">
          <select
            id="source-language-select"
            value={sourceLang}
            onChange={(e) => onChangeSource(e.target.value)}
            className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl px-3.5 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 text-xs">
            ▼
          </div>
        </div>
        {detectedLang && sourceLang === 'auto' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            শনাক্ত: {detectedLang}
          </span>
        )}
      </div>

      {/* Swap Button (only if source is not auto) */}
      {onSwapLanguages && (
        <button
          id="swap-languages-btn"
          type="button"
          onClick={onSwapLanguages}
          disabled={sourceLang === 'auto'}
          title={sourceLang === 'auto' ? 'স্বয়ংক্রিয় অবস্থায় পরিবর্তন প্রযোজ্য নয়' : 'ভাষা অদলবদল করুন'}
          className={`p-2 rounded-xl border border-slate-200 text-slate-600 transition-all ${
            sourceLang === 'auto'
              ? 'opacity-40 cursor-not-allowed bg-slate-50'
              : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
      )}

      {/* Target Language Picker */}
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
          অনুবাদ হবে:
        </span>
        <div className="relative flex-1">
          <select
            id="target-language-select"
            value={targetLang}
            onChange={(e) => onChangeTarget(e.target.value)}
            className="w-full appearance-none bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold rounded-xl px-3.5 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            {TARGET_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-emerald-700 text-xs">
            ▼
          </div>
        </div>
      </div>
    </div>
  );
};
