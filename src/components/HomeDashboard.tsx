import React from 'react';
import {
  Mic,
  Headphones,
  BookOpen,
  Users,
  Layers,
  GraduationCap,
  Languages,
  History,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Globe,
  CheckCircle2,
  FileText,
  Volume2,
  Sliders,
  MapPin,
  Info,
} from 'lucide-react';
import { TranslationMode } from '../types';
import { AppLanguage, getTranslation } from '../utils/i18n';

interface HomeDashboardProps {
  onSelectMode: (mode: TranslationMode) => void;
  targetLang: string;
  onSelectTargetLang: (lang: string) => void;
  notebookCount: number;
  onOpenNotebook: () => void;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenWelcome: () => void;
  currentLanguage?: AppLanguage;
  onOpenSettings?: (tab?: 'settings' | 'about') => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectMode,
  targetLang,
  onSelectTargetLang,
  notebookCount,
  onOpenNotebook,
  historyCount,
  onOpenHistory,
  onOpenWelcome,
  currentLanguage = 'bn',
  onOpenSettings,
}) => {
  const t = (key: string) => getTranslation(currentLanguage, key);

  const mainModules: {
    id: TranslationMode;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    badge: string;
    badgeColor: string;
    bgHover: string;
    accentColor: string;
    featured?: boolean;
  }[] = [
    {
      id: 'live-voice',
      title: t('liveVoiceTitle'),
      subtitle: t('liveVoiceSub'),
      description: t('liveVoiceDesc'),
      icon: <Mic className="w-6 h-6" />,
      badge: t('liveVoiceBadge'),
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      bgHover: 'hover:border-emerald-500 hover:shadow-emerald-50 dark:hover:shadow-none',
      accentColor: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      featured: true,
    },
    {
      id: 'earphone-interpreter',
      title: t('earphoneTitle'),
      subtitle: t('earphoneSub'),
      description: t('earphoneDesc'),
      icon: <Headphones className="w-6 h-6" />,
      badge: t('earphoneBadge'),
      badgeColor: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      bgHover: 'hover:border-sky-500 hover:shadow-sky-50 dark:hover:shadow-none',
      accentColor: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800',
      featured: true,
    },
    {
      id: 'audiobook',
      title: t('audiobookTitle'),
      subtitle: t('audiobookSub'),
      description: t('audiobookDesc'),
      icon: <BookOpen className="w-6 h-6" />,
      badge: t('audiobookBadge'),
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      bgHover: 'hover:border-amber-500 hover:shadow-amber-50 dark:hover:shadow-none',
      accentColor: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      featured: true,
    },
    {
      id: 'conversation',
      title: t('conversationTitle'),
      subtitle: t('conversationSub'),
      description: t('conversationDesc'),
      icon: <Users className="w-6 h-6" />,
      badge: t('conversationBadge'),
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      bgHover: 'hover:border-indigo-500 hover:shadow-indigo-50 dark:hover:shadow-none',
      accentColor: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    },
    {
      id: 'content',
      title: t('contentTitle'),
      subtitle: t('contentSub'),
      description: t('contentDesc'),
      icon: <Layers className="w-6 h-6" />,
      badge: t('contentBadge'),
      badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      bgHover: 'hover:border-purple-500 hover:shadow-purple-50 dark:hover:shadow-none',
      accentColor: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800',
    },
    {
      id: 'learning',
      title: t('learningTitle'),
      subtitle: t('learningSub'),
      description: t('learningDesc'),
      icon: <GraduationCap className="w-6 h-6" />,
      badge: t('learningBadge'),
      badgeColor: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      bgHover: 'hover:border-rose-500 hover:shadow-rose-50 dark:hover:shadow-none',
      accentColor: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    },
    {
      id: 'text',
      title: t('textTitle'),
      subtitle: t('textSub'),
      description: t('textDesc'),
      icon: <Languages className="w-6 h-6" />,
      badge: t('textBadge'),
      badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      bgHover: 'hover:border-teal-500 hover:shadow-teal-50 dark:hover:shadow-none',
      accentColor: 'text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800',
    },
  ];

  return (
    <div 
      className="space-y-6 pb-12"
      dir={currentLanguage === 'ar' || currentLanguage === 'ur' ? 'rtl' : 'ltr'}
    >
      {/* Hero Welcome Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 sm:p-8 text-white border border-emerald-900/60 shadow-xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('appSubtitle')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-bengali tracking-tight text-white">
              {t('appName')}
            </h1>
          </div>

          {/* Quick Stats / Action shortcuts */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenNotebook}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="font-bengali">{t('notebook')} ({notebookCount})</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur transition-all active:scale-95"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span className="font-bengali">{t('history')} ({historyCount})</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => onOpenSettings('settings')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 backdrop-blur transition-all active:scale-95"
              >
                <Sliders className="w-4 h-4 text-emerald-300" />
                <span className="font-bengali">{t('settings')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenWelcome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold border border-amber-400/30 backdrop-blur transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="font-bengali">{t('guide')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Menu Cards Grid - Mobile Friendly & Responsive */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-bengali flex items-center gap-2">
            <span>{t('allFeatures')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mainModules.map((item) => (
            <button
              key={item.id}
              type="button"
              id={`home-menu-${item.id}`}
              onClick={() => onSelectMode(item.id)}
              className={`group text-left p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] flex flex-col justify-between ${item.bgHover}`}
            >
              <div className="space-y-4 w-full">
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${item.accentColor}`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border font-bengali ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-bengali group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Bottom Action Hint */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between w-full text-xs font-bold text-emerald-700 dark:text-emerald-400 font-bengali">
                <span className="group-hover:translate-x-0.5 transition-transform">
                  {t('openFeature')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Utilities Section: Notebook & History */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button
          type="button"
          onClick={onOpenNotebook}
          className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-slate-900 dark:to-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all text-left flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-300 font-bengali">
                {t('notebook')}
              </h4>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold shrink-0 font-bengali">
            {notebookCount} {t('notesCount')}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all text-left flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white font-bengali">
                {t('history')}
              </h4>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold shrink-0 font-bengali">
            {historyCount} {t('historyCount')}
          </span>
        </button>
      </div>

      {/* Creator & Academy Banner as requested */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-md">
                {t('creatorCourtesy')}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-bengali">
                {t('creatorOrg')}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{t('creatorLocationFull')}</span>
            </p>
          </div>
        </div>

        {onOpenSettings && (
          <button
            type="button"
            onClick={() => onOpenSettings('about')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span className="font-bengali">{t('about')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
