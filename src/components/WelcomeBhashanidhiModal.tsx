import React, { useState, useEffect } from 'react';
import { BhashanidhiLogo } from './BhashanidhiLogo';
import {
  Sparkles,
  ArrowRight,
  Mic,
  Users,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Languages,
  CheckCircle2,
  X,
  Headphones
} from 'lucide-react';
import { useBackHandler } from '../utils/backNavigation';

interface WelcomeBhashanidhiModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const WelcomeBhashanidhiModal: React.FC<WelcomeBhashanidhiModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If forceOpen is provided (e.g. user clicked Help button), open it
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Check if this is the user's first time opening the app
    try {
      const hasWelcomed = localStorage.getItem('bhashanidhi_first_time_welcomed');
      if (!hasWelcomed) {
        setIsOpen(true);
      }
    } catch {
      // Fallback
    }
  }, [forceOpen]);

  // Support device back button to close welcome modal
  useBackHandler(
    () => {
      handleClose();
      return true;
    },
    95,
    isOpen,
    'welcome-bhashanidhi-modal'
  );

  const handleClose = () => {
    try {
      localStorage.setItem('bhashanidhi_first_time_welcomed', 'true');
    } catch {
      // ignore
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden text-slate-800">
        {/* Decorative Ambient Background Header */}
        <div className="relative bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 p-6 sm:p-8 text-white text-center overflow-hidden">
          {/* Subtle Background Glow Circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

          {/* Close button if user re-opened */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <BhashanidhiLogo size="lg" />
          </div>

          {/* Primary Welcome Title */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-bengali text-amber-300 drop-shadow-sm mb-1">
            ভাষানিধি
          </h2>

          <p className="text-sm sm:text-base text-emerald-100 font-bengali max-w-lg mx-auto font-medium">
            ল্যাঙ্গুয়েজ ব্রিজ একাডেমি
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-emerald-700/40 border border-emerald-500/30 text-emerald-200 text-xs font-medium font-bengali">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>আরবি • ইংরেজি • উর্দু • বাংলা ও যেকোনো ভাষা</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 transition-colors sm:col-span-2 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-emerald-950 font-bengali">
                    🎧 কানে কানে দোভাষী (প্রেসিডেন্ট ইয়ারফোন মোড)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-950 text-[10px] font-bold">নতুন</span>
                </div>
                <p className="text-xs text-emerald-900/80 font-bengali mt-1 leading-relaxed">
                  বিদেশী ব্যক্তি কথা বলার সাথে সাথেই সাইড থেকে ব্যক্তিগত দোভাষীর মতো প্রতিটি বাক্য রিয়েল-টাইমে বাংলায় অনূদিত হয়ে সরাসরি আপনার ইয়ারফোনে/হেডফোনে স্পষ্ট অডিও মোডে শোনানো হবে।
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5">
                <Mic className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-bengali">
                🎓 লাইভ লেকচার ও স্বয়ংক্রিয় নোটস
              </h4>
              <p className="text-xs text-slate-500 font-bengali mt-1 leading-relaxed">
                প্রফেসরের আরবি, ইংরেজি ও উর্দু লেকচার সরাসরি শুনে তাৎক্ষণিক বাংলা অনুবাদ ও স্টাডি সারাংশ পান।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2.5">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-bengali">
                🤝 দ্বিভাষিক ফেস-টু-ফেস কথপোকথন
              </h4>
              <p className="text-xs text-slate-500 font-bengali mt-1 leading-relaxed">
                দুজন ভিন্নভাষী মুখোমুখি বসে নিজস্ব ভাষায় কথা বলুন; সিস্টেম সরাসরি অনুবাদ করে ভয়েস শোনাবে।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-bengali">
                💡 স্বয়ংক্রিয় প্রশ্ন-উত্তর পপআপ
              </h4>
              <p className="text-xs text-slate-500 font-bengali mt-1 leading-relaxed">
                ক্লাসে শিক্ষক প্রশ্ন করলে মুহূর্তের মধ্যে প্রশ্ন সংগ্রহ করে হাত তুলে বলার মতো স্মার্ট উত্তর তৈরি করে দেয়।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 transition-colors col-span-1 sm:col-span-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-amber-950 font-bengali">
                      📖 ইউনিভার্সাল এআই অডিওবুক স্টুডিও (Audiobook Generator)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-bold">নতুন পাওয়ারফুল ফিচার</span>
                  </div>
                  <p className="text-xs text-amber-900/80 font-bengali mt-1 leading-relaxed">
                    যেকোনো পিডিএফ, ওয়ার্ড ফাইল, ফেসবুক/ইউটিউব লিংক বা বড় লেখা দিন—আপনার পছন্দের যেকোনো ভাষায় (বাংলা, আরবি, ইংরেজি ইত্যাদি) তৈরি হবে বহুধাপের প্রাণবন্ত অডিওবুক সাথে রিয়েল-টাইম স্ক্রিন হাইলাইটিং ও স্টুডিও ভয়েস।
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-bengali">
                📚 স্টাডি নোটবুক ও ফাইল হাব
              </h4>
              <p className="text-xs text-slate-500 font-bengali mt-1 leading-relaxed">
                ছবি, পিডিএফ ও ওয়ার্ড ফাইলের সেন্টেন্স-বাই-সেন্টেন্স নিখুঁত অনুবাদ ও সমৃদ্ধ স্টাডি নোটবুক।
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bengali">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>মোবাইল ও কম্পিউটারের ব্যাক বাটন সুরক্ষিত</span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm font-bengali shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>ভাষানিধি শুরু করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
