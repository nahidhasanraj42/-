import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeDashboard } from './components/HomeDashboard';
import { LanguageSelector } from './components/LanguageSelector';
import { LiveMicTranslator } from './components/LiveMicTranslator';
import { MediaTranslator } from './components/MediaTranslator';
import { DocumentTranslator } from './components/DocumentTranslator';
import { TextTranslator } from './components/TextTranslator';
import { ImageTranslator } from './components/ImageTranslator';
import { UnifiedContentHub } from './components/UnifiedContentHub';
import { BilingualConversation } from './components/BilingualConversation';
import { EarphoneInterpreter } from './components/EarphoneInterpreter';
import { AudiobookStudio } from './components/AudiobookStudio';
import { LanguageLearningHub } from './components/LanguageLearningHub';
import { TranslationHistory } from './components/TranslationHistory';
import { StudyNotebookDrawer } from './components/StudyNotebookDrawer';
import { FloatingSelectionMenu } from './components/FloatingSelectionMenu';
import { DeviceBackExitToast } from './components/DeviceBackExitToast';
import { WelcomeBhashanidhiModal } from './components/WelcomeBhashanidhiModal';
import { SettingsModal, ThemeMode } from './components/SettingsModal';
import { TranslationMode, TranslationResult, NotebookItem } from './types';
import { Sparkles, Mic, Video, FileText, CheckCircle2, BookOpen, GraduationCap, Users, Image as ImageIcon, Headphones, ArrowLeft, History } from 'lucide-react';
import { backNavigation, useBackHandler } from './utils/backNavigation';
import { AppLanguage, getTranslation } from './utils/i18n';

const INITIAL_NOTEBOOK_SEED: NotebookItem[] = [
  {
    id: 'seed-1',
    title: 'السَّلَامُ عَلَيْكُمْ (আসসালামু আলাইকুম)',
    content: 'উচ্চারণ: আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ\nঅর্থ: আপনার উপর শান্তি ও আল্লাহর রহমত বর্ষিত হোক\nনোট: আরবি ভাষায় সাক্ষাতের প্রধান ও সর্বোত্তম শিষ্টাচার।',
    category: 'vocabulary',
    originalText: 'السَّلَامُ عَلَيْكُمْ',
    sourceLanguage: 'ar',
    timestamp: Date.now() - 3600000 * 24,
  },
  {
    id: 'seed-2',
    title: 'Perspective (পারস্পেক্টিভ)',
    content: 'উচ্চারণ: পারস্পেক্টিভ\nঅর্থ: দৃষ্টিভঙ্গি / দৃষ্টিকোণ\nবাক্য: From my perspective, regular practice is essential.',
    category: 'vocabulary',
    originalText: 'Perspective',
    sourceLanguage: 'en',
    timestamp: Date.now() - 3600000 * 12,
  },
  {
    id: 'seed-3',
    title: 'آپ کیسے ہیں؟ (আপ ক্যায়সে হ্যায়?)',
    content: 'উচ্চারণ: আপ ক্যায়সে হ্যায়?\nঅর্থ: আপনি কেমন আছেন?\nপদ: সৌজন্যমূলক কুশল বিনিময় (উর্দু)।',
    category: 'phrase',
    originalText: 'آپ کیسے ہیں؟',
    sourceLanguage: 'ur',
    timestamp: Date.now() - 3600000 * 6,
  },
];

export default function App() {
  const [activeMode, setActiveMode] = useState<TranslationMode>('home');
  const [modeHistory, setModeHistory] = useState<TranslationMode[]>([]);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('bn');
  const [detectedLang, setDetectedLang] = useState<string>('');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'settings' | 'about'>('settings');

  // App Settings: Language & Theme
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('bn');
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(false);

  const [history, setHistory] = useState<TranslationResult[]>([]);
  const [notes, setNotes] = useState<NotebookItem[]>([]);

  // Initialize unified back navigation manager and listen for back-stack changes
  useEffect(() => {
    backNavigation.init();
    const unsubscribe = backNavigation.onCanGoBackChange((canBack) => {
      setCanGoBack(canBack);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('bhashanidhi_app_lang') as AppLanguage;
      if (savedLang && ['bn', 'en', 'ar', 'ur'].includes(savedLang)) {
        setCurrentLanguage(savedLang);
        document.documentElement.lang = savedLang;
        document.documentElement.dir = (savedLang === 'ar' || savedLang === 'ur') ? 'rtl' : 'ltr';
      } else {
        document.documentElement.lang = 'bn';
      }

      const savedTheme = localStorage.getItem('bhashanidhi_theme') as ThemeMode;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setCurrentTheme(savedTheme);
      }

      const savedRate = localStorage.getItem('bhashanidhi_speech_rate');
      if (savedRate) {
        setSpeechRate(parseFloat(savedRate) || 1.0);
      }

      const savedAutoplay = localStorage.getItem('bhashanidhi_autoplay');
      if (savedAutoplay) {
        setAutoPlayAudio(savedAutoplay === 'true');
      }
    } catch (e) {
      console.warn('Failed to load user preferences', e);
    }
  }, []);

  // Theme synchronization with html element
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: ThemeMode) => {
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(currentTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);

  const handleChangeLanguage = (newLang: AppLanguage) => {
    setCurrentLanguage(newLang);
    try {
      localStorage.setItem('bhashanidhi_app_lang', newLang);
    } catch (e) {}
    document.documentElement.lang = newLang;
    document.documentElement.dir = (newLang === 'ar' || newLang === 'ur') ? 'rtl' : 'ltr';
  };

  const handleChangeTheme = (newTheme: ThemeMode) => {
    setCurrentTheme(newTheme);
    try {
      localStorage.setItem('bhashanidhi_theme', newTheme);
    } catch (e) {}
  };

  const handleToggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    handleChangeTheme(nextTheme);
  };

  const handleOpenSettings = (tab: 'settings' | 'about' = 'settings') => {
    setSettingsInitialTab(tab);
    setIsSettingsOpen(true);
  };

  // Back handler for Settings Modal
  useBackHandler(
    () => {
      setIsSettingsOpen(false);
      return true;
    },
    60,
    isSettingsOpen,
    'app-settings-modal'
  );

  // Back handler for History Drawer
  useBackHandler(
    () => {
      setIsHistoryOpen(false);
      return true;
    },
    50,
    isHistoryOpen,
    'app-history-drawer'
  );

  // Back handler for Notebook Drawer
  useBackHandler(
    () => {
      setIsNotebookOpen(false);
      return true;
    },
    50,
    isNotebookOpen,
    'app-notebook-drawer'
  );

  // Back handler for Mode navigation (returns to home or previous mode)
  useBackHandler(
    () => {
      if (activeMode !== 'home') {
        if (modeHistory.length > 0) {
          const previousMode = modeHistory[modeHistory.length - 1];
          setModeHistory((prev) => prev.slice(0, -1));
          setActiveMode(previousMode);
        } else {
          setActiveMode('home');
        }
        return true;
      }
      return false;
    },
    10,
    activeMode !== 'home' && !isHistoryOpen && !isNotebookOpen && !isSettingsOpen,
    'app-mode-history'
  );

  // Handler for user switching modes
  const handleSelectMode = (newMode: TranslationMode) => {
    if (newMode !== activeMode) {
      if (activeMode !== 'home') {
        setModeHistory((prev) => [...prev, activeMode]);
      } else {
        setModeHistory(['home']);
      }
      setActiveMode(newMode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Load history and notebook from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('multilang_translation_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.warn('Failed to parse translation history', e);
    }

    try {
      const savedNotes = localStorage.getItem('bhashanidhi_study_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes(INITIAL_NOTEBOOK_SEED);
        localStorage.setItem('bhashanidhi_study_notes', JSON.stringify(INITIAL_NOTEBOOK_SEED));
      }
    } catch (e) {
      console.warn('Failed to parse study notes', e);
      setNotes(INITIAL_NOTEBOOK_SEED);
    }
  }, []);

  const handleSaveResult = (result: Omit<TranslationResult, 'id' | 'timestamp'>) => {
    const newResult: TranslationResult = {
      ...result,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const updated = [newResult, ...history].slice(0, 50);
    setHistory(updated);
    try {
      localStorage.setItem('multilang_translation_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save translation history to localStorage', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('multilang_translation_history');
    } catch (e) {
      console.warn('Failed to clear translation history', e);
    }
  };

  const handleSaveToNotebook = (item: Omit<NotebookItem, 'id' | 'timestamp'>) => {
    const newItem: NotebookItem = {
      ...item,
      id: 'note-' + Date.now(),
      timestamp: Date.now(),
    };
    const updated = [newItem, ...notes];
    setNotes(updated);
    try {
      localStorage.setItem('bhashanidhi_study_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save study notes to localStorage', e);
    }
  };

  const handleAddNote = (newNote: Omit<NotebookItem, 'id' | 'timestamp'>) => {
    handleSaveToNotebook(newNote);
  };

  const handleUpdateNote = (id: string, updates: Partial<NotebookItem>) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, ...updates } : n));
    setNotes(updated);
    try {
      localStorage.setItem('bhashanidhi_study_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update note in storage', e);
    }
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    try {
      localStorage.setItem('bhashanidhi_study_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete note from storage', e);
    }
  };

  const handleClearAllNotes = () => {
    setNotes([]);
    try {
      localStorage.removeItem('bhashanidhi_study_notes');
    } catch (e) {
      console.warn('Failed to clear notes', e);
    }
  };

  const handleSelectionAddToNotebook = (text: string) => {
    handleSaveToNotebook({
      title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
      content: text,
      category: 'study_notes',
      originalText: text,
      sourceLanguage: 'auto',
    });
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const t = (key: string) => getTranslation(currentLanguage, key);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 dark:selection:bg-emerald-800 selection:text-emerald-950 dark:selection:text-emerald-100 transition-colors">
      {/* Floating Selection Action Menu on text highlight */}
      <FloatingSelectionMenu onAddToNotebook={handleSelectionAddToNotebook} />

      {/* Top Header with Navigation */}
      <Header
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        historyCount={history.length}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        isHistoryOpen={isHistoryOpen}
        notebookCount={notes.length}
        onToggleNotebook={() => setIsNotebookOpen(!isNotebookOpen)}
        canGoBack={canGoBack}
        onBack={() => backNavigation.triggerBack()}
        onOpenWelcome={() => setIsWelcomeOpen(true)}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleChangeLanguage}
        currentTheme={currentTheme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {activeMode === 'home' ? (
          <HomeDashboard
            onSelectMode={handleSelectMode}
            targetLang={targetLang}
            onSelectTargetLang={setTargetLang}
            notebookCount={notes.length}
            onOpenNotebook={() => setIsNotebookOpen(true)}
            historyCount={history.length}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenWelcome={() => setIsWelcomeOpen(true)}
            currentLanguage={currentLanguage}
            onOpenSettings={handleOpenSettings}
          />
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Top Bar for Dedicated Feature Screen */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  id="feature-back-to-home-btn"
                  onClick={() => handleSelectMode('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 active:scale-95 shadow-2xs"
                  title={t('backToHome')}
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-bengali">{t('backToHome')}</span>
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bengali hidden sm:inline">
                  {t('fullScreenFocus')}
                </span>
              </div>

              {/* Language Selector (Shown on standard translation tabs) */}
              {['live-voice', 'earphone-interpreter', 'content', 'media', 'document', 'text'].includes(activeMode) && (
                <div className="w-full sm:w-auto">
                  <LanguageSelector
                    sourceLang={sourceLang}
                    targetLang={targetLang}
                    onChangeSource={setSourceLang}
                    onChangeTarget={setTargetLang}
                    onSwapLanguages={handleSwapLanguages}
                    detectedLang={detectedLang}
                  />
                </div>
              )}
            </div>

            {/* Active Mode Panels */}
            <div className="transition-opacity duration-200">
              {activeMode === 'live-voice' && (
                <LiveMicTranslator
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                  onSwitchToEarphoneMode={() => handleSelectMode('earphone-interpreter')}
                />
              )}

              {activeMode === 'earphone-interpreter' && (
                <EarphoneInterpreter
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                />
              )}

              {activeMode === 'audiobook' && (
                <AudiobookStudio
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                />
              )}

              {activeMode === 'conversation' && (
                <BilingualConversation onSaveToNotebook={handleSaveToNotebook} />
              )}

              {activeMode === 'content' && (
                <UnifiedContentHub
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                />
              )}

              {activeMode === 'learning' && (
                <LanguageLearningHub onSaveToNotebook={handleSaveToNotebook} />
              )}

              {activeMode === 'text' && (
                <TextTranslator
                  sourceLang={sourceLang}
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                  onDetectLanguage={setDetectedLang}
                />
              )}

              {activeMode === 'media' && (
                <MediaTranslator
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                />
              )}

              {activeMode === 'document' && (
                <DocumentTranslator
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                />
              )}

              {activeMode === 'image' && (
                <ImageTranslator
                  targetLang={targetLang}
                  onSaveResult={handleSaveResult}
                  onSaveToNotebook={handleSaveToNotebook}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* History Drawer */}
      <TranslationHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectResult={(item) => {
          setIsHistoryOpen(false);
          setActiveMode(item.mode);
        }}
      />

      {/* Study Notebook Drawer */}
      <StudyNotebookDrawer
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        notes={notes}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        onAddNote={handleAddNote}
        onClearAllNotes={handleClearAllNotes}
      />

      {/* Settings & About Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleChangeLanguage}
        currentTheme={currentTheme}
        onChangeTheme={handleChangeTheme}
        speechRate={speechRate}
        onChangeSpeechRate={(rate) => {
          setSpeechRate(rate);
          try {
            localStorage.setItem('bhashanidhi_speech_rate', rate.toString());
          } catch (e) {}
        }}
        autoPlayAudio={autoPlayAudio}
        onToggleAutoPlayAudio={(enabled) => {
          setAutoPlayAudio(enabled);
          try {
            localStorage.setItem('bhashanidhi_autoplay', enabled ? 'true' : 'false');
          } catch (e) {}
        }}
        onClearHistory={handleClearHistory}
        onClearNotebook={handleClearAllNotes}
        onOpenWelcomeGuide={() => {
          setIsSettingsOpen(false);
          setIsWelcomeOpen(true);
        }}
        historyCount={history.length}
        notebookCount={notes.length}
        initialTab={settingsInitialTab}
      />

      {/* First-time Welcome & Feature Guide Modal */}
      <WelcomeBhashanidhiModal
        forceOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />

      {/* Device Back Button Double-Tap Exit Toast */}
      <DeviceBackExitToast />

      {/* Clean, Simple Footer as requested by user */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 mt-8 text-center text-xs text-slate-500 dark:text-slate-400 font-bengali font-medium transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3">
          <span>{t('appName')} • {t('appSubtitle')}</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
            {t('creatorCourtesy')}: {t('creatorOrg')}, {t('creatorLocationFull')}
          </span>
        </div>
      </footer>
    </div>
  );
}
