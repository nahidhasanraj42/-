import React, { useState } from 'react';
import { 
  X, 
  Globe, 
  Sun, 
  Moon, 
  Laptop, 
  Volume2, 
  Sparkles, 
  Info, 
  Trash2, 
  Check, 
  Building2, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Heart, 
  Sliders, 
  HelpCircle 
} from 'lucide-react';
import { AppLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../utils/i18n';
import { BhashanidhiLogo } from './BhashanidhiLogo';

export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  currentTheme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
  autoPlayAudio: boolean;
  onToggleAutoPlayAudio: (enabled: boolean) => void;
  onClearHistory: () => void;
  onClearNotebook: () => void;
  onOpenWelcomeGuide: () => void;
  historyCount: number;
  notebookCount: number;
  initialTab?: 'settings' | 'about';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onChangeLanguage,
  currentTheme,
  onChangeTheme,
  speechRate,
  onChangeSpeechRate,
  autoPlayAudio,
  onToggleAutoPlayAudio,
  onClearHistory,
  onClearNotebook,
  onOpenWelcomeGuide,
  historyCount,
  notebookCount,
  initialTab = 'settings',
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'about'>(initialTab);
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = (key: string) => getTranslation(currentLanguage, key);

  const showNotification = (msg: string) => {
    setClearedMessage(msg);
    setTimeout(() => setClearedMessage(null), 3000);
  };

  const handleClearHistoryConfirm = () => {
    if (window.confirm(t('clearHistoryConfirm'))) {
      onClearHistory();
      showNotification(t('dataClearedSuccess'));
    }
  };

  const handleClearNotebookConfirm = () => {
    if (window.confirm(t('clearNotebookConfirm'))) {
      onClearNotebook();
      showNotification(t('dataClearedSuccess'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        dir={currentLanguage === 'ar' || currentLanguage === 'ur' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-bengali">
                {activeTab === 'settings' ? t('settings') : t('about')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali">
                {t('appName')} • {t('appSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t('settings')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'about'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>{t('about')}</span>
          </button>
        </div>

        {/* Toast alert inside modal */}
        {clearedMessage && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{clearedMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {activeTab === 'settings' ? (
            <>
              {/* Language Selection */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {t('appLanguage')}
                    </h4>
                  </div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md font-semibold">
                    ডিফল্ট: বাংলা
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('appLanguageDesc')}
                </p>

                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = currentLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => onChangeLanguage(lang.code)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-2xs font-bold'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{lang.flag}</span>
                          <div>
                            <p className="text-xs sm:text-sm">{lang.nativeName}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">{lang.name}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Theme Selection */}
              <section className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t('theme')}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onChangeTheme('light')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-2 transition-all ${
                      currentTheme === 'light'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="text-xs">{t('lightMode')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeTheme('dark')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-2 transition-all ${
                      currentTheme === 'dark'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs">{t('darkMode')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeTheme('system')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border gap-2 transition-all ${
                      currentTheme === 'system'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs">{t('systemTheme')}</span>
                  </button>
                </div>
              </section>

              {/* Audio & Speech Preferences */}
              <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t('speechSpeed')}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { rate: 0.8, label: t('slowSpeed') },
                    { rate: 1.0, label: t('normalSpeed') },
                    { rate: 1.25, label: t('fastSpeed') },
                  ].map((item) => (
                    <button
                      key={item.rate}
                      type="button"
                      onClick={() => onChangeSpeechRate(item.rate)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        speechRate === item.rate
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {t('audioAutoplay')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleAutoPlayAudio(!autoPlayAudio)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      autoPlayAudio ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        autoPlayAudio ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </section>

              {/* Data & Cache Management */}
              <section className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('dangerZone')}
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleClearHistoryConfirm}
                    disabled={historyCount === 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ইতিহাস মুছুন ({historyCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearNotebookConfirm}
                    disabled={notebookCount === 0}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>নোটবুক মুছুন ({notebookCount})</span>
                  </button>
                </div>
              </section>
            </>
          ) : (
            /* About Creator Tab */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Creator Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-slate-50 dark:from-slate-800 dark:via-emerald-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 text-center space-y-3 shadow-xs">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <GraduationCap className="w-7 h-7" />
                </div>
                
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {t('creatorCourtesy')}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5 font-bengali">
                    {t('creatorOrg')}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{t('creatorLocationFull')}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-bengali">
                  {t('creatorMission')}
                </p>
              </div>

              {/* Mission & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bengali">একাডেমির উদ্দেশ্য</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bengali mt-0.5">
                      আরবি, ইংরেজি ও উর্দু ভাষা সহজ বাংলায় আত্মস্থ করা ও গ্লোবাল কমিউনিকেশন সহজ করা।
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bengali">বিশ্বমানের এআই প্রযুক্তি</h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-bengali mt-0.5">
                      অডিওবুক, কানে কানে রিয়েল-টাইম দোভাষী ও লাইভ প্রফেসর স্পিচ অনুবাদক।
                    </p>
                  </div>
                </div>
              </div>

              {/* App Info & Guide Trigger */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white font-bengali">
                    {t('appVersion')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bengali">
                    {t('rightsReserved')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWelcomeGuide();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{t('guide')}</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-bengali">
                {t('developerNote')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bengali">
            {t('creatorOrg')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
