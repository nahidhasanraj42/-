import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  FileText,
  Video,
  Languages,
  History,
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
  Image as ImageIcon,
  ArrowLeft,
  Layers,
  Headphones,
  Home,
  ChevronRight,
  MoreVertical,
  Sliders,
  Sun,
  Moon,
  Globe,
  Info,
  Check,
} from 'lucide-react';
import { TranslationMode } from '../types';
import { BhashanidhiLogo } from './BhashanidhiLogo';
import { AppLanguage, getTranslation } from '../utils/i18n';
import { ThemeMode } from './SettingsModal';

interface HeaderProps {
  activeMode: TranslationMode;
  onSelectMode: (mode: TranslationMode) => void;
  historyCount: number;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  notebookCount: number;
  onToggleNotebook: () => void;
  canGoBack?: boolean;
  onBack?: () => void;
  onOpenWelcome?: () => void;
  currentLanguage: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: (tab?: 'settings' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  historyCount,
  onToggleHistory,
  isHistoryOpen,
  notebookCount,
  onToggleNotebook,
  canGoBack = false,
  onBack,
  onOpenWelcome,
  currentLanguage,
  onChangeLanguage,
  currentTheme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => getTranslation(currentLanguage, key);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const modeMetadata: Record<
    string,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    'live-voice': {
      label: t('liveVoiceTitle'),
      icon: <Mic className="w-4 h-4" />,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    'earphone-interpreter': {
      label: t('earphoneTitle'),
      icon: <Headphones className="w-4 h-4" />,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    audiobook: {
      label: t('audiobookTitle'),
      icon: <BookOpen className="w-4 h-4" />,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    conversation: {
      label: t('conversationTitle'),
      icon: <Users className="w-4 h-4" />,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    content: {
      label: t('contentTitle'),
      icon: <Layers className="w-4 h-4" />,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    learning: {
      label: t('learningTitle'),
      icon: <GraduationCap className="w-4 h-4" />,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    text: {
      label: t('textTitle'),
      icon: <Languages className="w-4 h-4" />,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
    },
  };

  const isCurrentFeaturePage = activeMode !== 'home';
  const currentMeta = modeMetadata[activeMode];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onSelectMode('home')}
              className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-hidden"
              title={t('backToHome')}
            >
              <BhashanidhiLogo size="md" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-bengali group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {t('appName')}
                  </h1>
                </div>
                {/* Clean Subtitle */}
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali font-medium">
                  {t('appSubtitle')}
                </p>
              </div>
            </button>
          </div>

          {/* Right Action Icons (Always accessible on Mobile & Desktop) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Home Button (visible when inside a feature) */}
            {isCurrentFeaturePage && (
              <button
                type="button"
                onClick={() => onSelectMode('home')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 active:scale-95 shadow-2xs"
                title={t('returnHome')}
              >
                <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bengali hidden sm:inline">{t('home')}</span>
              </button>
            )}

            {/* Back Button */}
            {canGoBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 active:scale-95"
                title={t('back')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-bengali hidden sm:inline">{t('back')}</span>
              </button>
            )}

            {/* Notebook Button */}
            <button
              type="button"
              id="notebook-toggle-btn"
              onClick={onToggleNotebook}
              className="relative p-2 sm:px-3 sm:py-1.5 text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold flex items-center gap-1.5"
              title={t('notebook')}
            >
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden md:inline font-bengali">{t('notebook')}</span>
              {notebookCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-700 text-white">
                  {notebookCount}
                </span>
              )}
            </button>

            {/* History Button */}
            <button
              type="button"
              id="history-toggle-btn"
              onClick={onToggleHistory}
              className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl transition-colors border text-xs font-bold flex items-center gap-1.5 ${
                isHistoryOpen
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80'
              }`}
              title={t('history')}
            >
              <History className="w-4 h-4" />
              <span className="hidden md:inline font-bengali">{t('history')}</span>
              {historyCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isHistoryOpen
                      ? 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {historyCount}
                </span>
              )}
            </button>

            {/* Three-Dot Menu (থ্রি ডট মেনু) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                id="header-threedot-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl transition-all border text-xs font-bold flex items-center justify-center ${
                  isMenuOpen
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="মেনু ও সেটিংস"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  dir={currentLanguage === 'ar' || currentLanguage === 'ur' ? 'rtl' : 'ltr'}
                >
                  {/* Quick Theme Toggle Item */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center gap-2.5">
                      {currentTheme === 'dark' ? (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-500" />
                      )}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bengali">
                        {currentTheme === 'dark' ? t('darkMode') : t('lightMode')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleTheme()}
                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {currentTheme === 'dark' ? 'লাইট করুন' : 'ডার্ক করুন'}
                    </button>
                  </div>

                  {/* Settings Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings('settings');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold font-bengali">{t('settings')}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold">
                      ভাষা ও স্পিড
                    </span>
                  </button>

                  {/* Language Switch Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings('settings');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-bold font-bengali">{t('appLanguage')}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      {currentLanguage}
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* Creator / Academy About Info */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings('about');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold font-bengali">{t('about')}</span>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md font-semibold">
                      রাজশাহী
                    </span>
                  </button>

                  {/* Welcome Guide */}
                  {onOpenWelcome && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenWelcome();
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold font-bengali">{t('guide')}</span>
                    </button>
                  )}

                  {/* Creator Note Footer inside dropdown */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-2.5 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-bengali">
                    সৌজন্যে: ল্যাঙ্গুয়েজ ব্রিজ একাডেমি, রাজশাহী
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Context Banner (Only displayed when inside a specific feature) */}
        {isCurrentFeaturePage && currentMeta && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectMode('home')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-bengali">{t('backToHome')}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-bengali">
                <span>{t('home')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border font-bengali bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs">
                <span>{currentMeta.icon}</span>
                <span>{currentMeta.label}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectMode('home')}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-bold font-bengali"
            >
              {t('allFeatures')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
