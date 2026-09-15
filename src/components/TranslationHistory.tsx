import React, { useState } from 'react';
import { X, Trash2, Copy, Check, Volume2, Mic, Video, FileText, Languages, Headphones, Globe } from 'lucide-react';
import { TranslationResult } from '../types';
import { speakText } from '../utils/audioUtils';
import { AudiobookPlayerModal } from './AudiobookPlayerModal';
import { useBackHandler } from '../utils/backNavigation';

interface TranslationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: TranslationResult[];
  onClearHistory: () => void;
  onSelectResult: (result: TranslationResult) => void;
}

export const TranslationHistory: React.FC<TranslationHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectResult,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAudiobookItem, setActiveAudiobookItem] = useState<TranslationResult | null>(null);

  // Handle device back button to close history drawer
  useBackHandler(
    () => {
      onClose();
      return true;
    },
    50,
    isOpen && !activeAudiobookItem,
    'history-drawer'
  );

  if (!isOpen) return null;

  const getModeIcon = (mode: string, mediaType?: string) => {
    if (mediaType === 'url') return <Globe className="w-4 h-4 text-emerald-600" />;
    switch (mode) {
      case 'live-voice':
        return <Mic className="w-4 h-4 text-red-500" />;
      case 'media':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <Languages className="w-4 h-4 text-emerald-500" />;
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base font-bengali">পূর্বের অনুবাদ ইতিহাস</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="সকল ইতিহাস মুছুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Languages className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-bengali text-sm font-medium text-slate-600">
                এখনো কোনো অনুবাদ সম্পন্ন হয়নি
              </p>
              <p className="text-xs text-slate-400 mt-1 font-bengali">
                মাইক্রোফোনে কথা বললে, অডিও/ভিডিও বা ডকুমেন্ট অনুবাদ করলে তা এখানে সংরক্ষিত থাকবে।
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    {getModeIcon(item.mode, item.mediaType)}
                    <span className="font-semibold text-slate-600">
                      {item.sourceLang} ➔ {item.targetLang}
                    </span>
                    {item.mediaName && (
                      <span className="truncate max-w-[120px] text-slate-500">
                        • {item.mediaName}
                      </span>
                    )}
                  </div>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="text-xs">
                  <p className="text-slate-500 line-clamp-2 italic">
                    "{item.originalText.slice(0, 100)}"
                  </p>
                  <p className="text-slate-900 font-medium font-bengali mt-1 line-clamp-2">
                    {item.translatedText}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => speakText(item.translatedText, 'bn')}
                      className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>শুনুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveAudiobookItem(item)}
                      className="text-slate-700 hover:text-emerald-700 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md"
                      title="অডিওবুক হিসেবে শুনুন ও ডাউনলোড করুন"
                    >
                      <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                      <span>অডিওবুক</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.translatedText)}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-medium">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 text-center text-xs text-slate-400 bg-slate-50 font-bengali">
          আপনার ব্রাউজারে এটি নিরাপদে সংরক্ষিত আছে
        </div>
      </div>

      {/* Audiobook Player Modal */}
      {activeAudiobookItem && (
        <AudiobookPlayerModal
          isOpen={!!activeAudiobookItem}
          onClose={() => setActiveAudiobookItem(null)}
          text={activeAudiobookItem.translatedText}
          title={activeAudiobookItem.mediaName || 'অনূদিত অডিওবুক'}
          lang="bn"
        />
      )}
    </div>
  );
};
