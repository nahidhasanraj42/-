import React, { useState, useRef, useEffect } from 'react';
import {
  Headphones,
  BookOpen,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Download,
  Copy,
  Check,
  Clock,
  Sliders,
  FileText,
  Link2,
  Upload,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FastForward,
  Rewind,
  Moon,
  Layers,
  ListOrdered,
  Radio,
  FileUp,
  Globe,
  Share2,
  Trash2,
  X,
  FolderHeart,
} from 'lucide-react';
import { AudiobookProject, AudiobookChapter, TranslationResult } from '../types';
import { speakText, formatDuration } from '../utils/audioUtils';

interface AudiobookStudioProps {
  targetLang?: string;
  onSaveResult?: (result: TranslationResult) => void;
  onSaveToNotebook?: (
    title: string,
    content: string,
    originalText?: string,
    sourceLanguage?: string,
    category?: 'vocabulary' | 'grammar' | 'phrase' | 'study_notes' | 'conversation'
  ) => void;
}

const SUPPORTED_AUDIOBOOK_LANGUAGES = [
  { code: 'bn', name: 'বাংলা (Bengali)', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ar', name: 'আরবি (Arabic)', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'ইংরেজি (English)', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ur', name: 'উর্দু (Urdu)', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'hi', name: 'হিন্দি (Hindi)', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', name: 'ফরাসি (French)', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'জার্মান (German)', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'স্প্যানিশ (Spanish)', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'tr', name: 'তুর্কি (Turkish)', nativeName: 'Türkçe', flag: '🇹🇷' },
];

export function getSalmanFarsiDemo(targetLang: string = 'bn'): AudiobookProject {
  return {
    id: 'demo_salman_farsi',
    title: 'হযরত সালমান ফারসী (রা.): সত্যের সন্ধানে এক দীর্ঘ পথচলা',
    authorOrSource: 'সিরাত ও সাহাবীদের জীবনগাথা • সত্যের এক বিস্ময়কর সফর',
    sourceType: 'text',
    detectedSourceLang: 'আরবি ও ফারসি (Arabic & Persian)',
    targetLanguage: targetLang || 'bn',
    style: 'podcast',
    narratorTone: 'calm',
    voiceGender: 'male',
    createdAt: Date.now(),
    summary:
      'হযরত সালমান ফারসী (রা.)-এর ইসলাম গ্রহণের ঘটনাটি অত্যন্ত দীর্ঘ এবং অনুপ্রেরণাদায়ক। একে বলা হয় \'সত্যের সন্ধানে এক দীর্ঘ পথচলা\'। পারস্যের ইস্পাহানে অগ্নিপূজক পরিবার থেকে শুরু করে সিরিয়ার গির্জা ও আমোরিয়ার উস্তাদের অন্তিম বার্তা, আরব বণিকের বিশ্বাসঘাতকতায় মদিনার দাসত্ব, এবং নবী চেনার ৩টি অকাট্য নিদর্শন (সদকা না খাওয়া, হাদিয়া গ্রহণ করা ও পিঠের নবুওয়াতের মোহর) স্বচক্ষে প্রত্যক্ষ করে রাসূলুল্লাহ (সা.)-এর পবিত্র হাতে ইসলাম গ্রহণ করার এক অবিস্মরণীয় ইতিহাস।',
    chapters: [
      {
        chapterNumber: 1,
        title: 'অধ্যায় ১: পারস্যের আগুন থেকে খ্রিস্টান গির্জার সান্নিধ্যে',
        estimatedDurationSec: 150,
        keyThemes: ['পারস্য', 'ইস্পাহান', 'সত্যের খোঁজ', 'গৃহত্যাগ'],
        audiobookText:
          'হযরত সালমান ফারসী (রা.)-এর ইসলাম গ্রহণের ঘটনাটি অত্যন্ত অনুপ্রেরণাদায়ক। একে বলা হয় সত্যের সন্ধানে এক দীর্ঘ পথচলা। পারস্যের (বর্তমান ইরান) ইস্পাহানে এক অগ্নিপূজক পরিবারে তাঁর জন্ম হয়। তাঁর পিতা ছিলেন গ্রামের প্রধান এবং ছেলেকে আগুনের উপাসনায় এতটাই নিবেদিত করেছিলেন যে, তাঁকে ঘরের বাইরে যেতে দিতেন না। একদিন বাবার নির্দেশে খামারে যাওয়ার পথে তিনি একটি খ্রিস্টান গির্জা দেখতে পান এবং তাদের ইবাদত দেখে মুগ্ধ হন। তাঁর মনে হলো, এই দ্বীন তাদের অগ্নি উপাসনার চেয়ে অনেক শ্রেষ্ঠ। সত্যের সন্ধানে বাবার অমতে তিনি সিরিয়ায় চলে যান এবং সেখানে একের পর এক পাদ্রীর সান্নিধ্যে থেকে জ্ঞান অর্জন করতে থাকেন।',
        sentences: [
          'হযরত সালমান ফারসী (রা.)-এর ইসলাম গ্রহণের ঘটনাটি অত্যন্ত অনুপ্রেরণাদায়ক; একে বলা হয় সত্যের সন্ধানে এক দীর্ঘ পথচলা।',
          'পারস্যের বর্তমান ইরানের ইস্পাহানে এক অগ্নিপূজক পরিবারে তাঁর জন্ম হয়।',
          'তাঁর পিতা ছিলেন গ্রামের প্রধান এবং ছেলেকে আগুনের উপাসনায় এতটাই নিবেদিত করেছিলেন যে, তাঁকে ঘরের বাইরে যেতে দিতেন না।',
          'একদিন বাবার নির্দেশে খামারে যাওয়ার পথে তিনি একটি খ্রিস্টান গির্জা দেখতে পান এবং তাদের ইবাদত দেখে মুগ্ধ হন।',
          'তাঁর মনে হলো, এই দ্বীন তাদের অগ্নি উপাসনার চেয়ে অনেক শ্রেষ্ঠ ও অর্থবহ।',
          'সত্যের সন্ধানে বাবার অমতে তিনি সিরিয়ায় চলে যান এবং একের পর এক পাদ্রীর সান্নিধ্যে থেকে জ্ঞান অর্জন করতে থাকেন।',
        ],
      },
      {
        chapterNumber: 2,
        title: 'অধ্যায় ২: আমোরিয়ার উস্তাদের অন্তিম বাণী ও নবী চেনার ৩ নিদর্শন',
        estimatedDurationSec: 175,
        keyThemes: ['আমোরিয়া', 'ভবিষ্যদ্বাণী', 'নবী চেনার নিদর্শন', 'মদিনা'],
        audiobookText:
          'মৃত্যুর আগে তাঁর শেষ উস্তাদ আমোরিয়ার এক পাদ্রী তাঁকে বলেছিলেন, "বৎস, এখন পৃথিবীতে এমন কেউ নেই যার কাছে তোমাকে পাঠাতে পারি। তবে খুব শীঘ্রই আরব ভূখণ্ডে একজন নবীর আবির্ভাব ঘটবে, যিনি ইব্রাহিম (আ.)-এর দ্বীন নিয়ে আসবেন। তিনি হিজরত করে এমন এক জায়গায় যাবেন যেখানে প্রচুর খেজুর বাগান এবং যা দুটি পাথুরে মাঠের মাঝখানে অবস্থিত।" সেই পাদ্রী তাঁকে নবী চেনার তিনটি বিশেষ নিদর্শনের কথা বলে দেন: এক, তিনি সদকার মাল নিজে খাবেন না। দুই, তাঁকে হাদিয়া বা উপহার দিলে তিনি তা গ্রহণ করবেন। এবং তিন, তাঁর দুই কাঁধের মাঝখানে নবুওয়াতের মোহর থাকবে।',
        sentences: [
          'মৃত্যুর আগে তাঁর শেষ উস্তাদ আমোরিয়ার এক পাদ্রী তাঁকে এক বিশেষ বার্তা দিয়েছিলেন।',
          'তিনি বলেছিলেন: "বৎস, এখন পৃথিবীতে এমন কেউ নেই যার কাছে তোমাকে পাঠাতে পারি।"',
          '"তবে খুব শীঘ্রই আরব ভূখণ্ডে একজন নবীর আবির্ভাব ঘটবে, যিনি ইব্রাহিম (আ.)-এর দ্বীন নিয়ে আসবেন।"',
          '"তিনি হিজরত করে এমন এক জায়গায় যাবেন যেখানে প্রচুর খেজুর বাগান এবং দুটি পাথুরে মাঠের মাঝখানে অবস্থিত।"',
          'সেই পাদ্রী তাঁকে নবী চেনার তিনটি বিশেষ নিদর্শনের কথা বলে দেন:',
          'এক: তিনি সদকার মাল নিজে খাবেন না।',
          'দুই: তাঁকে হাদিয়া বা উপহার দিলে তিনি তা গ্রহণ করবেন।',
          'তিন: তাঁর দুই কাঁধের মাঝখানে নবুওয়াতের মোহর থাকবে।',
        ],
      },
      {
        chapterNumber: 3,
        title: 'অধ্যায় ৩: কাফেলার বিশ্বাসঘাতকতা, মদিনায় দাসত্ব ও খেজুর বাগান',
        estimatedDurationSec: 140,
        keyThemes: ['কাফেলা', 'বিশ্বাসঘাতকতা', 'মদিনা', 'দাসত্ব'],
        audiobookText:
          'এরপর সালমান (রা.) এক আরব বণিকের কাফেলায় যোগ দিয়ে আরবের পথে রওনা হন। কিন্তু তারা তাঁর সাথে চরম বিশ্বাসঘাতকতা করে তাঁকে মদিনার এক ইহুদির কাছে গোলাম হিসেবে বিক্রি করে দেয়। মদিনায় প্রচুর খেজুর বাগান দেখে তিনি চিনতে পারেন যে, এটাই সেই জায়গা যার কথা উস্তাদ বলে গিয়েছিলেন। সেখানে তিনি দাসত্বের কঠিন শৃঙ্খলে থেকেও প্রতিক্ষণ শেষ নবীর আগমনের গভীর প্রতীক্ষায় দিন কাটাতে লাগলেন।',
        sentences: [
          'এরপর সালমান (রা.) এক আরব বণিকের কাফেলায় যোগ দিয়ে আরবের উদ্দেশ্যে রওনা হন।',
          'কিন্তু তারা তাঁর সাথে চরম বিশ্বাসঘাতকতা করে তাঁকে মদিনার এক ইহুদির কাছে গোলাম হিসেবে বিক্রি করে দেয়।',
          'মদিনায় পৌঁছে চারপাশের প্রচুর খেজুর বাগান দেখে তিনি চিনতে পারেন যে, এটাই সেই জায়গা যার কথা উস্তাদ বলে গিয়েছিলেন।',
          'সেখানে তিনি দাসত্বের কঠিন শৃঙ্খলে থেকেও প্রতিক্ষণ শেষ নবীর আগমনের গভীর প্রতীক্ষায় দিন কাটাতে লাগলেন।',
        ],
      },
      {
        chapterNumber: 4,
        title: 'অধ্যায় ৪: রাসূলুল্লাহ (সা.)-এর সাথে সাক্ষাৎ, পরীক্ষা ও ইসলাম গ্রহণ',
        estimatedDurationSec: 210,
        keyThemes: ['রাসূলুল্লাহ (সা.)', 'সদকা পরীক্ষা', 'হাদিয়া পরীক্ষা', 'নবুওয়াতের মোহর', 'ইসলাম গ্রহণ'],
        audiobookText:
          'রাসূলুল্লাহ (সা.) যখন মদিনায় হিজরত করলেন, সালমান (রা.) তখন এক খেজুর গাছে কাজ করছিলেন। তিনি সংবাদ পেয়েই সত্য যাচাইয়ের জন্য কিছু খেজুর নিয়ে রাসূলের দরবারে গেলেন এবং বললেন এগুলো সদকা। রাসূলুল্লাহ (সা.) নিজে না খেয়ে সাহাবীদের খেতে বললেন; সালমান (রা.) প্রথম চিহ্নটি পেলেন। পরদিন তিনি কিছু খেজুর নিয়ে গিয়ে বললেন এগুলো আপনার জন্য উপহার। তখন রাসূল (সা.) নিজে খেলেন এবং সাহাবীদেরও দিলেন; দ্বিতীয় চিহ্নটিও মিলে গেল। সবশেষে একদিন রাসূল (সা.) জানাজা থেকে ফিরছিলেন, তখন সালমান (রা.) তাঁর পিছনে অপেক্ষা করছিলেন মোহরটি দেখার জন্য। রাসূলুল্লাহ (সা.) তাঁর মনের আকুলতা বুঝতে পেরে পিঠের চাদরটি আলতো করে সরিয়ে দিলেন। সালমান (রা.) সেই নবুওয়াতের মোহর স্বচক্ষে প্রত্যক্ষ করে কান্নায় ভেঙে পড়লেন। তিনি রাসূলের পবিত্র হাতে চুম্বন করলেন এবং পরম শ্রদ্ধায় ইসলাম গ্রহণ করলেন।',
        sentences: [
          'রাসূলুল্লাহ (সা.) যখন মদিনায় হিজরত করলেন, সালমান (রা.) তখন এক খেজুর গাছে কাজ করছিলেন।',
          'তিনি সংবাদ পেয়েই সত্য যাচাইয়ের জন্য কিছু খেজুর নিয়ে রাসূলের দরবারে গেলেন এবং বললেন এগুলো সদকা।',
          'রাসূলুল্লাহ (সা.) নিজে না খেয়ে সাহাবীদের খেতে বললেন; সালমান (রা.) প্রথম চিহ্নটি পেয়ে গেলেন।',
          'পরদিন তিনি আবার কিছু খেজুর নিয়ে গিয়ে বললেন: এগুলো আপনার জন্য উপহার বা হাদিয়া।',
          'তখন রাসূল (সা.) নিজে খেলেন এবং সাহাবীদেরও দিলেন; দ্বিতীয় চিহ্নটিও হুবহু মিলে গেল।',
          'সবশেষে একদিন রাসূল (সা.) জানাজা থেকে ফিরছিলেন, তখন সালমান (রা.) তাঁর পিছনে অপেক্ষা করছিলেন মোহরটি দেখার জন্য।',
          'রাসূলুল্লাহ (সা.) তাঁর ব্যাকুলতা বুঝতে পেরে পিঠের চাদরটি আলতো করে সরিয়ে দিলেন।',
          'সালমান (রা.) সেই পবিত্র নবুওয়াতের মোহর স্বচক্ষে দেখে কান্নায় ভেঙে পড়লেন।',
          'তিনি রাসূলুল্লাহ (সা.)-এর পবিত্র হাতে চুম্বন করলেন এবং পরম শ্রদ্ধায় ইসলাম গ্রহণ করলেন।',
        ],
      },
      {
        chapterNumber: 5,
        title: 'অধ্যায় ৫: দাসত্ব থেকে মুক্তি ও আহলে বায়তের মর্যাদা',
        estimatedDurationSec: 150,
        keyThemes: ['দাসত্বমুক্তি', 'খন্দকের যুদ্ধ', 'পরিখা খনন', 'আহলে বায়ত'],
        audiobookText:
          'পরবর্তীতে রাসূল (সা.) এবং সাহাবীদের সহায়তায় বিপুল পরিমাণ অর্থ এবং খেজুর গাছ রোপণের বিনিময়ে তিনি দাসত্ব থেকে মুক্তি পান। খন্দকের যুদ্ধে পরিখা খননের রণকৌশল দিয়ে তিনি ইসলামের ইতিহাসে এক অবিস্মরণীয় অবদান রাখেন। তাঁর সম্পর্কে রাসূল (সা.) বলেছিলেন, "সালমান আমাদের আহলে বায়তের (পরিবারের) অন্তর্ভুক্ত।" সত্যের সন্ধানে তাঁর এই আত্মত্যাগ কিয়ামত পর্যন্ত মুমিনদের জন্য এক অফুরন্ত প্রেরণা।',
        sentences: [
          'পরবর্তীতে রাসূলুল্লাহ (সা.) এবং সাহাবীদের সহায়তায় বিপুল পরিমাণ অর্থ এবং খেজুর গাছ রোপণের বিনিময়ে তিনি দাসত্ব থেকে স্থায়ী মুক্তি পান।',
          'খন্দকের ঐতিহাসিক যুদ্ধে পরিখা খননের অনুপম রণকৌশল দিয়ে তিনি ইসলামের ইতিহাসে এক অবিস্মরণীয় অবদান রাখেন।',
          'তাঁর অপরিসীম ত্যাগের জন্য রাসূলুল্লাহ (সা.) ঘোষণা করেছিলেন: "সালমান আমাদের আহলে বায়তের বা পরিবারের অন্তর্ভুক্ত।"',
          'সত্যের সন্ধানে হযরত সালমান ফারসী (রা.)-এর এই দীর্ঘ সফর প্রতিটি সত্যপিপাসু মানুষের হৃদয়ে চিরকাল অম্লান থাকবে।',
        ],
      },
    ],
    vocabularyBank: [
      { term: 'خاتم النبوة (খাতামুন নবুওয়াত)', meaning: 'শেষ নবী মুহাম্মাদ (সা.)-এর দুই কাঁধের মাঝের বিশেষ ঐশী সীলমোহর' },
      { term: 'الصدقة والهدية (সদকা ও হাদিয়া)', meaning: 'সদকা নবী পরিবারের জন্য নিষিদ্ধ, কিন্তু হাদিয়া বা উপহার গ্রহণ অনুমোদিত' },
      { term: 'أهل البيت (আহলে বায়ত)', meaning: 'নবী পরিবার; সালমান (রা.)-কে সম্মানিত করে এই পরিবারভুক্ত ঘোষণা করা হয়' },
      { term: 'حفر الخندق (পরিখা খনন)', meaning: 'পারস্যের রণকৌশল যা মদিনা সুরক্ষায় সালমান (রা.) উদ্ভাবন করেছিলেন' },
    ],
  };
}

const AUDIOBOOK_STORAGE_KEY = 'bhashanidhi_saved_audiobooks';

const loadSavedAudiobooksFromStorage = (): AudiobookProject[] => {
  try {
    const raw = localStorage.getItem(AUDIOBOOK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const AudiobookStudio: React.FC<AudiobookStudioProps> = ({
  targetLang: initialTargetLang = 'bn',
  onSaveResult,
  onSaveToNotebook,
}) => {
  // Input Selection
  const [sourceType, setSourceType] = useState<'file' | 'url' | 'text' | 'media'>('file');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');

  // Target Language & Style options
  const [selectedLang, setSelectedLang] = useState<string>(initialTargetLang || 'bn');
  const [audiobookStyle, setAudiobookStyle] = useState<'verbatim' | 'podcast' | 'deep_study'>('verbatim');
  const [narratorTone, setNarratorTone] = useState<'calm' | 'academic' | 'energetic'>('calm');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');

  // Generation & Status - preloaded with Hazrat Salman Al-Farsi (RA) demo
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<AudiobookProject | null>(() => getSalmanFarsiDemo(initialTargetLang || 'bn'));

  // Saved Audiobooks & Download States
  const [savedAudiobooks, setSavedAudiobooks] = useState<AudiobookProject[]>(() => loadSavedAudiobooksFromStorage());
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState<string | null>(null);

  // Player State
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [useStudioGeminiVoice, setUseStudioGeminiVoice] = useState(false);
  const [isSynthesizingStudioVoice, setIsSynthesizingStudioVoice] = useState(false);
  const [copiedChapterId, setCopiedChapterId] = useState<number | null>(null);
  const [savedNotebookId, setSavedNotebookId] = useState<string | null>(null);

  // Audio & Speech references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const sleepTimerIntervalRef = useRef<any>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sentenceIntervalRef = useRef<any>(null);

  // Stop playback when component unmounts or chapter changes
  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, []);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerMinutes && isPlaying) {
      setSleepTimerRemaining(sleepTimerMinutes * 60);
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);

      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(sleepTimerIntervalRef.current);
            stopAudioPlayback();
            setSleepTimerMinutes(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!sleepTimerMinutes) {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      setSleepTimerRemaining(null);
    }
  }, [sleepTimerMinutes, isPlaying]);

  // Handle File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 45 * 1024 * 1024) {
      setError('ফাইলের সাইজ ৪৫ মেগাবাইটের মধ্যে হতে হবে।');
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // GENERATE AUDIOBOOK
  // -------------------------------------------------------------
  const handleGenerateAudiobook = async () => {
    setError(null);

    if (sourceType === 'file' && (!fileBase64 || !selectedFile)) {
      setError('দয়া করে একটি PDF বা Word ফাইল সিলেক্ট করুন।');
      return;
    }
    if (sourceType === 'url' && !urlInput.trim()) {
      setError('দয়া করে একটি বৈধ লিংক (URL) পেস্ট করুন।');
      return;
    }
    if (sourceType === 'text' && !textInput.trim()) {
      setError('দয়া করে কিছু টেক্সট লিখুন বা পেস্ট করুন।');
      return;
    }
    if (sourceType === 'media' && !fileBase64) {
      setError('দয়া করে একটি অডিও বা ভিডিও ফাইল আপলোড করুন।');
      return;
    }

    setIsGenerating(true);
    stopAudioPlayback();

    try {
      const response = await fetch('/api/audiobook/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType:
            sourceType === 'file'
              ? selectedFile?.name.toLowerCase().endsWith('.docx')
                ? 'word'
                : 'pdf'
              : sourceType,
          text: textInput,
          url: urlInput,
          fileBase64,
          fileName: selectedFile?.name || (sourceType === 'url' ? urlInput : 'input_text'),
          mimeType: selectedFile?.type || '',
          targetLang: selectedLang,
          style: audiobookStyle,
          narratorTone,
          voiceGender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'অডিওবুক তৈরি করতে সমস্যা হয়েছে।');
      }

      const data = await response.json();

      const newProject: AudiobookProject = {
        id: 'ab_' + Date.now(),
        title: data.title || 'অনন্য অডিওবুক',
        authorOrSource: data.authorOrSource || 'ভাষানিধি স্টুডিও',
        sourceType:
          sourceType === 'file'
            ? selectedFile?.name.toLowerCase().endsWith('.docx')
              ? 'word'
              : 'pdf'
            : sourceType,
        sourceFileName: selectedFile?.name,
        sourceUrl: urlInput || undefined,
        detectedSourceLang: data.detectedSourceLang || 'অটো',
        targetLanguage: selectedLang,
        style: audiobookStyle,
        narratorTone,
        voiceGender,
        summary: data.summary || '',
        chapters: data.chapters || [],
        vocabularyBank: data.vocabularyBank || [],
        sampleAudioBase64: data.sampleAudioBase64,
        createdAt: Date.now(),
      };

      setProject(newProject);
      setCurrentChapterIndex(0);
      setCurrentSentenceIndex(-1);

      // Save to main translation history if callback provided
      if (onSaveResult) {
        onSaveResult({
          id: newProject.id,
          sourceText: textInput || urlInput || selectedFile?.name || 'Audiobook Source',
          translatedText: `[অডিওবুক: ${newProject.title}]\nসারসংক্ষেপ: ${newProject.summary}\nমোট অধ্যায়: ${newProject.chapters.length}`,
          sourceLanguage: data.detectedSourceLang || 'auto',
          targetLanguage: selectedLang,
          timestamp: Date.now(),
          mode: 'document',
        });
      }
    } catch (err: any) {
      console.error('Audiobook generation error:', err);
      setError(err.message || 'অডিওবুক তৈরিতে ত্রুটি দেখা দিয়েছে।');
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------------------------------------
  // AUDIO PLAYBACK ENGINE (Web Speech API + Real-time Sentence Tracking)
  // -------------------------------------------------------------
  const stopAudioPlayback = () => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (sentenceIntervalRef.current) {
      clearInterval(sentenceIntervalRef.current);
    }
    setIsPlaying(false);
    setCurrentSentenceIndex(-1);
  };

  const playCurrentChapter = (
    startFromSentenceIndex: number = 0,
    overrideChapter?: AudiobookChapter,
    overrideProject?: AudiobookProject
  ) => {
    const activeProject = overrideProject || project;
    if (!activeProject) return;

    const chapterIdx = currentChapterIndex;
    const activeChapter = overrideChapter || activeProject.chapters[chapterIdx] || activeProject.chapters[0];
    if (!activeChapter) return;

    stopAudioPlayback();

    // If using Studio Voice and we have audio Base64
    if (useStudioGeminiVoice && activeProject.sampleAudioBase64 && currentChapterIndex === 0 && startFromSentenceIndex === 0) {
      const audio = new Audio(`data:audio/wav;base64,${activeProject.sampleAudioBase64}`);
      audioRef.current = audio;
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = playbackSpeed;
      audio.onended = () => {
        setIsPlaying(false);
        handleNextChapter();
      };
      audio.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Studio audio play error, falling back to Web Speech:', e);
        playWithWebSpeech(activeChapter, activeProject, startFromSentenceIndex);
      });
      return;
    }

    playWithWebSpeech(activeChapter, activeProject, startFromSentenceIndex);
  };

  const playWithWebSpeech = (
    chapter: AudiobookChapter,
    activeProject?: AudiobookProject,
    startFromSentenceIndex: number = 0
  ) => {
    if (!('speechSynthesis' in window)) {
      setError('আপনার ব্রাউজারে স্পিচ সিন্থেসিস অডিও সাপোর্ট নেই। স্টুডিও ভয়েস ব্যবহার করুন।');
      return;
    }

    const currentProj = activeProject || project;
    const sentences = chapter.sentences || [];
    const sentenceList = sentences.length > 0 ? sentences : [chapter.audiobookText];
    let currentIndex = Math.max(0, Math.min(startFromSentenceIndex, sentenceList.length - 1));

    setIsPlaying(true);
    setCurrentSentenceIndex(currentIndex);

    // Audio unlock and unpause for modern browsers
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn('SpeechSynthesis resume error:', e);
    }

    const playSentence = (idx: number) => {
      if (idx >= sentenceList.length) {
        setIsPlaying(false);
        setCurrentSentenceIndex(-1);
        handleNextChapter();
        return;
      }

      setCurrentSentenceIndex(idx);
      const textToSpeak = sentenceList[idx];

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackSpeed;
      utterance.volume = isMuted ? 0 : volume;
      const basePitch = narratorTone === 'calm' ? 0.95 : narratorTone === 'energetic' ? 1.05 : 1.0;
      utterance.pitch = voiceGender === 'female' ? Math.min(1.4, basePitch * 1.25) : Math.max(0.7, basePitch * 0.88);

      const targetLang = currentProj?.targetLanguage || selectedLang || 'bn';
      const bcp47Map: Record<string, string> = {
        bn: 'bn-BD',
        ar: 'ar-SA',
        en: 'en-US',
        ur: 'ur-PK',
        hi: 'hi-IN',
        fr: 'fr-FR',
        de: 'de-DE',
        es: 'es-ES',
        tr: 'tr-TR',
      };
      utterance.lang = bcp47Map[targetLang] || 'bn-BD';

      // Pick best matching voice
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (voices && voices.length > 0) {
        const langKey = targetLang.toLowerCase();
        const isFemale = voiceGender === 'female';
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().replace('_', '-').startsWith(langKey) &&
            (isFemale
              ? /female|woman|girl|zira|samantha|victoria|susan|karen|veena|catherine|mary|linda|heera|kalpana|priya|bangla.*female/i.test(v.name)
              : /male|man|boy|david|george|mark|alex|daniel|rishi|neel|amit|alok|guy|bangla.*male/i.test(v.name))
        );
        if (!matchedVoice) {
          matchedVoice = voices.find(
            (v) =>
              v.lang.toLowerCase().replace('_', '-').startsWith(langKey) ||
              (langKey === 'bn' && /bengali|bangla/i.test(v.name))
          );
        }
        if (!matchedVoice && langKey === 'bn') {
          matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith('hi') || /hindi/i.test(v.name));
        }
        if (!matchedVoice) {
          matchedVoice = voices.find((v) => v.default) || voices[0];
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        playSentence(idx + 1);
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        setTimeout(() => {
          if (idx + 1 < sentenceList.length) {
            playSentence(idx + 1);
          } else {
            setIsPlaying(false);
          }
        }, 200);
      };

      speechUtteranceRef.current = utterance;
      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech speak exception:', err);
      }
    };

    playSentence(currentIndex);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAudioPlayback();
    } else {
      playCurrentChapter(currentSentenceIndex >= 0 ? currentSentenceIndex : 0);
    }
  };

  const handleNextChapter = () => {
    if (!project) return;
    if (currentChapterIndex < project.chapters.length - 1) {
      setCurrentChapterIndex((prev) => prev + 1);
      setCurrentSentenceIndex(-1);
      stopAudioPlayback();
    } else {
      stopAudioPlayback();
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex((prev) => prev - 1);
      setCurrentSentenceIndex(-1);
      stopAudioPlayback();
    }
  };

  // Jump to specific sentence when user clicks on text
  const handleSentenceClick = (idx: number) => {
    playCurrentChapter(idx);
  };

  // Synthesize Studio Gemini Voice for current chapter
  const handleGenerateStudioChapterAudio = async () => {
    if (!project || !project.chapters[currentChapterIndex]) return;
    const chapter = project.chapters[currentChapterIndex];

    setIsSynthesizingStudioVoice(true);
    setError(null);

    try {
      const res = await fetch('/api/audiobook/tts-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: chapter.audiobookText,
          voiceGender,
          language: project.targetLanguage,
        }),
      });

      if (!res.ok) {
        throw new Error('স্টুডিও অডিও তৈরি করা সম্ভব হয়নি।');
      }

      const data = await res.json();
      if (data.audioBase64) {
        chapter.studioAudioBase64 = data.audioBase64;
        stopAudioPlayback();
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audioRef.current = audio;
        audio.volume = isMuted ? 0 : volume;
        audio.playbackRate = playbackSpeed;
        audio.onended = () => setIsPlaying(false);
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.warn('Studio voice generation error:', err);
      setError(err.message || 'স্টুডিও ভয়েস তৈরি করতে সমস্যা হয়েছে। ওয়েব স্পিচ প্লেয়ার চালু করা হচ্ছে।');
      if (project) {
        playWithWebSpeech(chapter, project, 0);
      }
    } finally {
      setIsSynthesizingStudioVoice(false);
    }
  };

  // Toggle voice gender dynamically and reflect in playback
  const handleToggleVoiceGender = (newGender: 'male' | 'female') => {
    setVoiceGender(newGender);
    if (project) {
      setProject((prev) => (prev ? { ...prev, voiceGender: newGender } : null));
    }
    if (isPlaying) {
      stopAudioPlayback();
      setTimeout(() => {
        playCurrentChapter(currentSentenceIndex >= 0 ? currentSentenceIndex : 0);
      }, 150);
    }
  };

  // Save full audiobook to local library
  const handleSaveAudiobook = () => {
    if (!project) return;
    try {
      const currentList = loadSavedAudiobooksFromStorage();
      const existingIdx = currentList.findIndex((p) => p.id === project.id || p.title === project.title);
      let updatedList: AudiobookProject[];
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = { ...project, updatedAt: Date.now() };
      } else {
        const newProj = {
          ...project,
          id: project.id || `audiobook_${Date.now()}`,
          createdAt: project.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
        updatedList = [newProj, ...currentList];
      }
      localStorage.setItem(AUDIOBOOK_STORAGE_KEY, JSON.stringify(updatedList));
      setSavedAudiobooks(updatedList);
      setSaveToastMessage('অডিওবুক সফলভাবে সংরক্ষিত হয়েছে ✓');
      setTimeout(() => setSaveToastMessage(null), 3000);
    } catch (err) {
      console.error('Save audiobook error:', err);
      setError('অডিওবুক সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Delete saved audiobook from local library
  const handleDeleteSavedAudiobook = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const currentList = loadSavedAudiobooksFromStorage();
      const updated = currentList.filter((p) => p.id !== id);
      localStorage.setItem(AUDIOBOOK_STORAGE_KEY, JSON.stringify(updated));
      setSavedAudiobooks(updated);
      setSaveToastMessage('সংরক্ষিত অডিওবুক মুছে ফেলা হয়েছে');
      setTimeout(() => setSaveToastMessage(null), 2500);
    } catch (err) {
      console.error('Delete saved audiobook error:', err);
    }
  };

  // Load a saved audiobook into current view
  const handleSelectSavedAudiobook = (savedProj: AudiobookProject) => {
    stopAudioPlayback();
    setProject(savedProj);
    setCurrentChapterIndex(0);
    setCurrentSentenceIndex(-1);
    if (savedProj.voiceGender) {
      setVoiceGender(savedProj.voiceGender);
    }
    if (savedProj.targetLanguage) {
      setSelectedLang(savedProj.targetLanguage);
    }
    setIsSavedModalOpen(false);
    setSaveToastMessage(`"${savedProj.title}" চালু করা হয়েছে`);
    setTimeout(() => setSaveToastMessage(null), 3000);
  };

  // Download high-fidelity .wav audio file for the current chapter
  const handleDownloadAudio = async () => {
    if (!project) return;
    const chapter = project.chapters[currentChapterIndex] || project.chapters[0];
    if (!chapter) return;

    setIsDownloadingAudio(true);
    setError(null);

    try {
      let base64Audio = chapter.studioAudioBase64 || (currentChapterIndex === 0 ? project.sampleAudioBase64 : undefined);

      if (!base64Audio) {
        const res = await fetch('/api/audiobook/tts-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: chapter.audiobookText,
            voiceGender,
            language: project.targetLanguage,
          }),
        });

        if (!res.ok) {
          throw new Error('অডিও রেন্ডার করতে সমস্যা হয়েছে।');
        }

        const data = await res.json();
        base64Audio = data.audioBase64;
        if (base64Audio) {
          chapter.studioAudioBase64 = base64Audio;
        }
      }

      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cleanTitle = (project.title || 'Audiobook').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40).trim();
        const genderLabel = voiceGender === 'female' ? 'মহিলা_কণ্ঠ' : 'পুরুষ_কণ্ঠ';
        a.download = `${cleanTitle}_অধ্যায়_${chapter.chapterNumber}_(${genderLabel}).wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setSaveToastMessage('অডিও ফাইল (.wav) ডাউনলোড সম্পন্ন হয়েছে ✓');
        setTimeout(() => setSaveToastMessage(null), 3000);
      } else {
        throw new Error('অডিও ফাইল প্রস্তুত করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      console.error('Download audio error:', err);
      setError(err.message || 'অডিও ফাইল ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  // Save to Study Notebook
  const handleSaveToStudyNotebook = () => {
    if (!project || !onSaveToNotebook) return;
    const chapter = project.chapters[currentChapterIndex];
    const title = `🎧 অডিওবুক: ${project.title} - ${chapter.title}`;
    const content = `সারসংক্ষেপ:\n${project.summary}\n\nঅধ্যায়ের মূল পাঠ:\n${chapter.audiobookText}\n\nমূল থিমসমূহ:\n${(
      chapter.keyThemes || []
    ).join(', ')}`;

    onSaveToNotebook(title, content, project.title, project.detectedSourceLang, 'study_notes');
    setSavedNotebookId('saved');
    setTimeout(() => setSavedNotebookId(null), 2500);
  };

  // Download complete audiobook script
  const handleDownloadScript = () => {
    if (!project) return;
    const header = `=======================================================\nভাষানিধি এআই অডিওবুক স্টুডিও\nশিরোনাম: ${project.title}\nউৎস ভাষা: ${project.detectedSourceLang} | অডিওবুকের ভাষা: ${project.targetLanguage}\nস্টাইল: ${project.style} | বাচনভঙ্গি: ${project.narratorTone}\n=======================================================\n\nসারসংক্ষেপ:\n${project.summary}\n\n`;

    const body = project.chapters
      .map(
        (ch) =>
          `[অধ্যায় ${ch.chapterNumber}: ${ch.title}]\n(আনুমানিক সময়: ${Math.round(ch.estimatedDurationSec / 60)} মিনিট)\n\n${
            ch.audiobookText
          }\n\n-------------------------------------------------------\n`
      )
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audiobook_${project.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load a rich sample demo audiobook
  const handleLoadDemo = (
    demoType: 'salman_farsi' | 'ibn_khaldun' | 'ai_ethics' | 'islamic_law',
    autoPlay: boolean = true
  ) => {
    stopAudioPlayback();
    setError(null);

    let demoProject: AudiobookProject;

    if (demoType === 'salman_farsi') {
      demoProject = getSalmanFarsiDemo(selectedLang || 'bn');
    } else if (demoType === 'ibn_khaldun') {
      demoProject = {
        id: 'demo_ibn_khaldun',
        title: 'মুকাদ্দিমাহ: সমাজবিজ্ঞান ও সভ্যতা গঠনের দর্শন',
        authorOrSource: 'আল্লামা ইবনে খালদুন (আরবি দর্শন ও ইতিহাস)',
        sourceType: 'text',
        detectedSourceLang: 'আরবি (العربية)',
        targetLanguage: selectedLang,
        style: 'deep_study',
        narratorTone: 'academic',
        voiceGender: 'male',
        createdAt: Date.now(),
        summary:
          'সমাজবিজ্ঞানের জনক ইবনে খালদুনের অমর গ্রন্থ মুকাদ্দিমাহর মূল দর্শন। কীভাবে মানুষের সামাজিক একাত্মতা (আসাবিয়্যাহ) একটি সাম্রাজ্য গড়ে তোলে এবং সময়ের পরিক্রমায় বিলাসিতা ও আত্মতুষ্টির কারণে তার পতন ঘটে, তার এক গভীর অডিও বিশ্লেষণ।',
        chapters: [
          {
            chapterNumber: 1,
            title: 'অধ্যায় ১: সমাজবিজ্ঞানের সূচনা ও আসাবিয়্যাহ তত্ত্ব',
            estimatedDurationSec: 150,
            keyThemes: ['সামাজিক সংহতি', 'আসাবিয়্যাহ', 'সভ্যতার সূচনা'],
            audiobookText:
              'মানব ইতিহাসের গতিপথ কোনো আকস্মিক ঘটনা নয়, বরং এক সুনির্দিষ্ট নিয়মে পরিচালিত হয়। ইবনে খালদুন যাকে বলেছেন আসাবিয়্যাহ বা দলবদ্ধ সংহতি। যখন একটি জনগোষ্ঠী পারস্পরিক আস্থা, আত্মত্যাগ ও ঐক্যের বন্ধনে আবদ্ধ থাকে, তখন তারা যেকোনো পরাশক্তিকে পরাজিত করে নতুন সভ্যতা প্রতিষ্ঠা করতে সক্ষম হয়। এই ঐক্যই হলো রাষ্ট্রের সবচেয়ে বড় মূলধন।',
            sentences: [
              'মানব ইতিহাসের গতিপথ কোনো আকস্মিক ঘটনা নয়, বরং এক সুনির্দিষ্ট নিয়মে পরিচালিত হয়।',
              'ইবনে খালদুন যাকে বলেছেন আসাবিয়্যাহ বা দলবদ্ধ সংহতি।',
              'যখন একটি জনগোষ্ঠী পারস্পরিক আস্থা, আত্মত্যাগ ও ঐক্যের বন্ধনে আবদ্ধ থাকে, তখন তারা যেকোনো পরাশক্তিকে পরাজিত করে নতুন সভ্যতা প্রতিষ্ঠা করতে সক্ষম হয়।',
              'এই ঐক্যই হলো রাষ্ট্রের সবচেয়ে বড় মূলধন।',
            ],
          },
          {
            chapterNumber: 2,
            title: 'অধ্যায় ২: সাম্রাজ্যের উত্থান, বিলাসিতা ও অবক্ষয়',
            estimatedDurationSec: 180,
            keyThemes: ['বিলাসিতা', 'ক্ষমতার স্থায়িত্ব', 'পতনের কারণ'],
            audiobookText:
              'ক্ষমতায় বসার পর দ্বিতীয় ও তৃতীয় প্রজন্মে শুরু হয় বিলাসিতা ও অনৈক্য। প্রাথমিক সংহতি তখন স্বার্থপরতায় রূপ নেয়। শাসকেরা তখন জনগণের কাছ থেকে বিচ্ছিন্ন হয়ে পড়ে এবং অতিরিক্ত কর চাপিয়ে দেয়। ফলে ব্যবসা-বাণিজ্য স্থবির হয়ে পড়ে এবং অর্থনৈতিক মেরুদণ্ড ভেঙে যায়। এভাবেই সভ্যতার সূর্য অস্তমিত হয়।',
            sentences: [
              'ক্ষমতায় বসার পর দ্বিতীয় ও তৃতীয় প্রজন্মে শুরু হয় বিলাসিতা ও অনৈক্য।',
              'প্রাথমিক সংহতি তখন স্বার্থপরতায় রূপ নেয়।',
              'শাসকেরা তখন জনগণের কাছ থেকে বিচ্ছিন্ন হয়ে পড়ে এবং অতিরিক্ত কর চাপিয়ে দেয়।',
              'ফলে ব্যবসা-বাণিজ্য স্থবির হয়ে পড়ে এবং অর্থনৈতিক মেরুদণ্ড ভেঙে যায়।',
              'এভাবেই সভ্যতার সূর্য অস্তমিত হয়।',
            ],
          },
          {
            chapterNumber: 3,
            title: 'অধ্যায় ৩: আধুনিক যুগের জন্য চিরন্তন শিক্ষা',
            estimatedDurationSec: 160,
            keyThemes: ['আধুনিক সমাজ', 'অর্থনৈতিক ন্যায়বিচার', 'শিক্ষা'],
            audiobookText:
              'আজকের আধুনিক রাষ্ট্রেও ইবনে খালদুনের দর্শন সমান প্রাসঙ্গিক। কোনো সমাজ যদি ন্যায়বিচার, ন্যায়পরায়ণ অর্থনীতি এবং জাতীয় সংহতি বজায় রাখতে ব্যর্থ হয়, তবে কেবল প্রযুক্তিগত শক্তি দিয়ে তার পতন ঠেকানো সম্ভব নয়। সুবিচারই হলো একটি জাতির দীর্ঘায়ু লাভের একমাত্র গ্যারান্টি।',
            sentences: [
              'আজকের আধুনিক রাষ্ট্রেও ইবনে খালদুনের দর্শন সমান প্রাসঙ্গিক।',
              'কোনো সমাজ যদি ন্যায়বিচার, ন্যায়পরায়ণ অর্থনীতি এবং জাতীয় সংহতি বজায় রাখতে ব্যর্থ হয়, তবে কেবল প্রযুক্তিগত শক্তি দিয়ে তার পতন ঠেকানো সম্ভব নয়।',
              'সুবিচারই হলো একটি জাতির দীর্ঘায়ু লাভের একমাত্র গ্যারান্টি।',
            ],
          },
        ],
        vocabularyBank: [
          { term: 'العصبية (আসাবিয়্যাহ)', meaning: 'পারস্পরিক সামাজিক ঐক্য ও সংহতির শক্তি' },
          { term: 'العমরান البشري', meaning: 'মানব সভ্যতা ও সামাজিক সংগঠন' },
        ],
      };
    } else if (demoType === 'ai_ethics') {
      demoProject = {
        id: 'demo_ai_ethics',
        title: 'কৃত্রিম বুদ্ধিমত্তা ও নৈতিকতার ভবিষ্যৎ',
        authorOrSource: 'কেমব্রিজ ও এমআইটি লেকচার সিরিজ (ইংরেজি)',
        sourceType: 'text',
        detectedSourceLang: 'ইংরেজি (English)',
        targetLanguage: selectedLang,
        style: 'podcast',
        narratorTone: 'energetic',
        voiceGender: 'male',
        createdAt: Date.now(),
        summary:
          'কৃত্রিম বুদ্ধিমত্তা কি মানুষের সৃজনশীলতাকে ছাড়িয়ে যাবে? মানুষের সিদ্ধান্ত নেওয়ার স্বাধীনতা এবং অ্যালগরিদমের আধিপত্যের মধ্যে ভবিষ্যৎ ভারসাম্য কেমন হবে? এক মনোমুগ্ধকর পডকাস্ট স্টাইলের অডিও আলোচনা।',
        chapters: [
          {
            chapterNumber: 1,
            title: 'অধ্যায় ১: অ্যালগরিদমিক বিপ্লবের দ্বারপ্রান্তে',
            estimatedDurationSec: 140,
            keyThemes: ['AI বিপ্লব', 'প্রযুক্তি ও মানুষ'],
            audiobookText:
              'আমরা এমন এক যুগসন্ধিক্ষণে দাঁড়িয়ে আছি, যেখানে যন্ত্র কেবল গণনা করে না, বরং চিন্তা ও অনুভূতির অনুকরণ করতে শুরু করেছে। এই বিপ্লব কেবল সফটওয়্যারের নয়, এটি মানব অস্তিত্বের এক অভূতপূর্ব রূপান্তর। স্বাগতম আমাদের বিশেষ অডিও পডকাস্টে।',
            sentences: [
              'আমরা এমন এক যুগসন্ধিক্ষণে দাঁড়িয়ে আছি, যেখানে যন্ত্র কেবল গণনা করে না, বরং চিন্তা ও অনুভূতির অনুকরণ করতে শুরু করেছে।',
              'এই বিপ্লব কেবল সফটওয়্যারের নয়, এটি মানব অস্তিত্বের এক অভূতপূর্ব রূপান্তর।',
              'স্বাগতম আমাদের বিশেষ অডিও পডকাস্টে।',
            ],
          },
          {
            chapterNumber: 2,
            title: 'অধ্যায় ২: সিদ্ধান্ত নেওয়ার স্বাধীনতা বনাম অ্যালগরিদম',
            estimatedDurationSec: 170,
            keyThemes: ['নৈতিকতা', 'মানব স্বাধীনতা'],
            audiobookText:
              'চিকিৎসাক্ষেত্র থেকে শুরু করে বিচার বিভাগ—সবখানেই যখন কৃত্রিম বুদ্ধিমত্তা সুপারিশ করছে, তখন মূল দায়ভার কার? অ্যালগরিদম পক্ষপাতহীন হতে পারে, কিন্তু সেই অ্যালগরিদম তো মানুষের তৈরি ডেটা থেকেই শিখছে। তাই নৈতিক মানদণ্ড নির্ধারণ করাই এখন বিজ্ঞানের সবচেয়ে বড় চ্যালেঞ্জ।',
            sentences: [
              'চিকিৎসাক্ষেত্র থেকে শুরু করে বিচার বিভাগ—সবখানেই যখন কৃত্রিম বুদ্ধিমত্তা সুপারিশ করছে, তখন মূল দায়ভার কার?',
              'অ্যালগরিদম পক্ষপাতহীন হতে পারে, কিন্তু সেই অ্যালগরিদম তো মানুষের তৈরি ডেটা থেকেই শিখছে।',
              'তাই নৈতিক মানদণ্ড নির্ধারণ করাই এখন বিজ্ঞানের সবচেয়ে বড় চ্যালেঞ্জ।',
            ],
          },
        ],
      };
    } else {
      demoProject = {
        id: 'demo_islamic_law',
        title: 'মাকাসিদ আশ-শরীয়াহ: আইনের সার্বিক মানবিক উদ্দেশ্য',
        authorOrSource: 'ইমাম আশ-শাতিবি (ইসলামিক আইনশাস্ত্র)',
        sourceType: 'text',
        detectedSourceLang: 'আরবি ও উর্দু (Arabic & Urdu)',
        targetLanguage: selectedLang,
        style: 'deep_study',
        narratorTone: 'calm',
        voiceGender: 'male',
        createdAt: Date.now(),
        summary:
          'ইসলামিক আইনশাস্ত্রের পাঁচটি অবিচ্ছেদ্য উদ্দেশ্য: জীবন, বুদ্ধি, ধর্ম, সম্পদ ও বংশমর্যাদা রক্ষা। আইনের মূল নির্যাস হলো মানুষের কল্যাণ নিশ্চিত করা এবং যেকোনো অনিষ্ট প্রতিরোধ করা।',
        chapters: [
          {
            chapterNumber: 1,
            title: 'অধ্যায় ১: পাঁচটি মৌলিক মানবিক অধিকার (দরুরিয়্যাত আল-খামসাহ)',
            estimatedDurationSec: 150,
            keyThemes: ['মানবাধিকার', 'মাকাসিদ', 'জনকল্যাণ'],
            audiobookText:
              'যেকোনো প্রগতিশীল আইনের মূল লক্ষ্য হলো মানুষের পাঁচটি মৌলিক অধিকার অক্ষুণ্ণ রাখা। এগুলো হলো জীবনের সুরক্ষা, জ্ঞানের স্বাধীনতা, বিশ্বাসের মর্যাদা, অর্থনৈতিক নিরাপত্তা এবং মানবিক মর্যাদা। এর কোনো একটি বিঘ্নিত হলে সমাজে ভারসাম্যহীনতা দেখা দেয়।',
            sentences: [
              'যেকোনো প্রগতিশীল আইনের মূল লক্ষ্য হলো মানুষের পাঁচটি মৌলিক অধিকার অক্ষুণ্ণ রাখা।',
              'এগুলো হলো জীবনের সুরক্ষা, জ্ঞানের স্বাধীনতা, বিশ্বাসের মর্যাদা, অর্থনৈতিক নিরাপত্তা এবং মানবিক মর্যাদা।',
              'এর কোনো একটি বিঘ্নিত হলে সমাজে ভারসাম্যহীনতা দেখা দেয়।',
            ],
          },
        ],
      };
    }

    setProject(demoProject);
    setCurrentChapterIndex(0);
    setCurrentSentenceIndex(0);

    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    if (autoPlay) {
      setTimeout(() => {
        playCurrentChapter(0, demoProject.chapters[0], demoProject);
      }, 200);
    }
  };

  const currentChapter = project?.chapters[currentChapterIndex];

  return (
    <div className="space-y-6">
      {/* Sleek Minimalist Audiobook Studio Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-bengali text-white">
                অডিওবুক স্টুডিও
              </h2>
              <p className="text-xs text-slate-400 font-bengali">
                {project ? project.title : 'যেকোনো ফাইল, লিংক বা লেখা থেকে অডিওবুক'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSavedModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span>সংরক্ষিত অডিওবুক ({savedAudiobooks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemo('salman_farsi', true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>সালমান ফারসী (রা.)</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemo('ibn_khaldun', true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all"
            >
              মুকাদ্দিমাহ
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemo('ai_ethics', true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all"
            >
              AI নীতিবিদ্যা
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemo('islamic_law', true)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/15 transition-all"
            >
              মাকাসিদ
            </button>
          </div>
        </div>
      </div>

      {/* Input Source & Configuration Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Source Type Tabs */}
        <div className="border-b border-slate-100 pb-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 font-bengali">
            উৎস নির্বাচন:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSourceType('file')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                sourceType === 'file'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>পিডিএফ ও ওয়ার্ড ফাইল (.pdf / .docx)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                sourceType === 'url'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>অনলাইন লিংক (ইউটিউব, ফেসবুক বা ওয়েবসাইট)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('text')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                sourceType === 'text'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>টেক্সট কপি-পেস্ট (Pasted Text)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('media')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                sourceType === 'media'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>অডিও বা ভিডিও ফাইল (.mp3 / .mp4 / .wav)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Input Box */}
        <div>
          {sourceType === 'file' && (
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-6 sm:p-8 text-center transition-colors bg-slate-50/60">
              <input
                type="file"
                id="audiobook-file-upload"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="audiobook-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FileUp className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 font-bengali">
                    {selectedFile ? selectedFile.name : 'এখানে ক্লিক করে PDF বা Word ফাইল আপলোড করুন'}
                  </p>
                  <p className="text-xs text-slate-500 font-bengali mt-1">
                    {selectedFile
                      ? `সাইজ: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • ফাইল প্রস্তুত`
                      : 'আরবি, ইংরেজি, উর্দু বা যেকোনো ভাষার বই, রিসার্চ পেপার বা ডকুমেন্টস (সর্বোচ্চ ৪৫ মেগাবাইট)'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{selectedFile ? 'অন্য ফাইল বেছে নিন' : 'ফাইল নির্বাচন করুন'}</span>
                </span>
              </label>
            </div>
          )}

          {sourceType === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 font-bengali">
                লিংকটি এখানে দিন (ইউটিউব ভিডিও, ফেসবুক পোস্ট/ভিডিও, নিউজ বা আর্টিকেলের URL):
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="যেমন: https://www.youtube.com/watch?v=... বা যেকোনো ওয়েবসাইটের লিংক"
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <Link2 className="w-5 h-5 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          )}

          {sourceType === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 font-bengali">
                  যেকোনো লেখা বা নোট পেস্ট করুন:
                </label>
                <span className="text-xs text-slate-400 font-bengali">{textInput.length} অক্ষর</span>
              </div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={5}
                placeholder="এখানে কোনো বড় নিবন্ধ, ক্লাসের লেকচার শিট, বইয়ের কোনো চ্যাপ্টার বা যেকোনো ভাষার লেখা পেস্ট করুন..."
                className="w-full p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bengali leading-relaxed resize-y"
              />
            </div>
          )}

          {sourceType === 'media' && (
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-6 sm:p-8 text-center transition-colors bg-slate-50/60">
              <input
                type="file"
                id="audiobook-media-upload"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="audiobook-media-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Radio className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 font-bengali">
                    {selectedFile ? selectedFile.name : 'অডিও বা ভিডিও ফাইল আপলোড করুন'}
                  </p>
                  <p className="text-xs text-slate-500 font-bengali mt-1">
                    {selectedFile
                      ? `সাইজ: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • ফাইল প্রস্তুত`
                      : 'রেকর্ড করা লেকচার, পডকাস্ট বা যেকোনো অডিও/ভিডিও ফাইল দিন'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{selectedFile ? 'অন্য ফাইল বেছে নিন' : 'মিডিয়া ফাইল নির্বাচন করুন'}</span>
                </span>
              </label>
            </div>
          )}
        </div>

        {/* 2. Language & Audiobook Customization Controls */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Language Selection (কাঙ্ক্ষিত ভাষা নির্বাচন) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 font-bengali flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>যে ভাষায় অডিওবুক শুনতে চান:</span>
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_AUDIOBOOK_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audiobook Presentation Style */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 font-bengali flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>অডিওবুকের ধরন (স্টাইল):</span>
              </label>
              <select
                value={audiobookStyle}
                onChange={(e: any) => setAudiobookStyle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="verbatim">১. পূর্ণাঙ্গ পাঠ (সব বাক্য হুবহু অনূদিত)</option>
                <option value="podcast">২. পডকাস্ট স্টোরিটেলিং (প্রাণবন্ত কথকতা)</option>
                <option value="deep_study">৩. বাস্তব উদাহরণসহ গভীর স্টাডি লেকচার</option>
              </select>
            </div>

            {/* Narrator Voice Tone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 font-bengali flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>বাচনভঙ্গি ও বাচন টোন:</span>
              </label>
              <select
                value={narratorTone}
                onChange={(e: any) => setNarratorTone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="calm">🌿 শান্ত ও সুমধুর (Calm & Soothing)</option>
                <option value="academic">🎓 গম্ভীর ও প্রাতিষ্ঠানিক (Academic)</option>
                <option value="energetic">⚡ প্রাণবন্ত ও সতেজ (Energetic)</option>
              </select>
            </div>

            {/* Voice Gender */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 font-bengali flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-indigo-600" />
                <span>কণ্ঠ নির্বাচন (Gender):</span>
              </label>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setVoiceGender('male')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    voiceGender === 'male'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  👨 পুরুষ কণ্ঠ
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGender('female')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    voiceGender === 'female'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  👩 নারী কণ্ঠ
                </button>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bengali">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>স্বয়ংক্রিয় অধ্যায় বিভাজন • লাইভ সিনক্রোনাইজড হাইলাইটিং • স্টাডি নোটবুক সিঙ্ক</span>
            </div>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateAudiobook}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-700 hover:from-indigo-500 hover:to-teal-600 text-white font-bold text-sm font-bengali shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>অডিওবুক তৈরি হচ্ছে (কিছুক্ষণ অপেক্ষা করুন)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>এআই অডিওবুক তৈরি করুন (Generate Audiobook)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bengali flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ACTIVE AUDIOBOOK PLAYER & READING HUB */}
      {project && currentChapter && (
        <div ref={playerRef} id="audiobook-player-hub" className="space-y-6 scroll-mt-6">
          {/* Main Player Controller Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-800/80 shadow-2xl relative overflow-hidden">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    অডিওবুক প্রস্তুত
                  </span>
                  <span className="text-xs text-indigo-300 font-bengali">
                    উৎস: {project.detectedSourceLang} → অডিও ভাষা: {project.targetLanguage.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-bengali text-white mt-1">
                  {project.title}
                </h3>
                {project.authorOrSource && (
                  <p className="text-xs text-indigo-200/80 font-bengali mt-0.5">{project.authorOrSource}</p>
                )}
              </div>

              {/* Utility actions */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                {/* Voice Gender Switcher */}
                <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/15">
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceGender('male')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      voiceGender === 'male'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    👨 পুরুষ কণ্ঠ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceGender('female')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      voiceGender === 'female'
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    👩 মহিলা কণ্ঠ
                  </button>
                </div>

                {/* Save Audiobook Button */}
                <button
                  type="button"
                  onClick={handleSaveAudiobook}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs"
                  title="অডিওবুকটি সেভ করুন"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>সেভ করুন</span>
                </button>

                {/* Download Audio Button */}
                <button
                  type="button"
                  disabled={isDownloadingAudio}
                  onClick={handleDownloadAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-xs disabled:opacity-50"
                  title="অডিও ফাইল ডাউনলোড (.wav)"
                >
                  {isDownloadingAudio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>অডিও ডাউনলোড (.wav)</span>
                </button>

                {/* Download Script Button */}
                <button
                  type="button"
                  onClick={handleDownloadScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all"
                  title="অডিওবুকের স্ক্রিপ্ট ডাউনলোড"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>স্ক্রিপ্ট (.txt)</span>
                </button>

                {/* Save to Study Notebook */}
                <button
                  type="button"
                  onClick={handleSaveToStudyNotebook}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all"
                  title="নোটবুকে সেভ করুন"
                >
                  <span>{savedNotebookId ? 'নোটবুক ✓' : 'নোটবুক'}</span>
                </button>
              </div>
            </div>

            {/* Save Toast Notification */}
            {saveToastMessage && (
              <div className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
                <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                <span>{saveToastMessage}</span>
              </div>
            )}

            {/* Current Chapter & Highlighting Status */}
            <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider font-bengali">
                  বর্তমান অধ্যায় ({currentChapterIndex + 1} / {project.chapters.length}):
                </p>
                <h4 className="text-lg sm:text-xl font-bold font-bengali text-amber-300 mt-0.5">
                  অধ্যায় {currentChapter.chapterNumber}: {currentChapter.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-indigo-200/70">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>আনুমানিক সময়: {Math.round(currentChapter.estimatedDurationSec / 60)} মিনিট</span>
                  </span>
                  <span>•</span>
                  <span>মোট বাক্য: {currentChapter.sentences.length} টি</span>
                </div>
              </div>

              {/* Studio Voice Switch */}
              <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-2xl border border-white/10">
                <button
                  type="button"
                  disabled={isSynthesizingStudioVoice}
                  onClick={handleGenerateStudioChapterAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-xs"
                >
                  {isSynthesizingStudioVoice ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>স্টুডিও অডিও তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>এআই স্টুডিও ভয়েস (Studio Voice)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Audio Controls Toolbar */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Main Playback Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrevChapter}
                  disabled={currentChapterIndex === 0}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="পূর্ববর্তী অধ্যায়"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95"
                  title={isPlaying ? 'পজ করুন' : 'প্লে করুন'}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleNextChapter}
                  disabled={currentChapterIndex >= project.chapters.length - 1}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="পরবর্তী অধ্যায়"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={stopAudioPlayback}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="থামান ও রিসেট"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed & Sleep Timer Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackSpeed(rate)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        playbackSpeed === rate
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Sleep Timer */}
                <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1.5 rounded-xl text-xs">
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={sleepTimerMinutes || ''}
                    onChange={(e) => setSleepTimerMinutes(e.target.value ? Number(e.target.value) : null)}
                    className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="" className="text-slate-900">
                      স্লিপ টাইমার বন্ধ
                    </option>
                    <option value="5" className="text-slate-900">
                      ৫ মিনিট পর বন্ধ
                    </option>
                    <option value="15" className="text-slate-900">
                      ১৫ মিনিট পর বন্ধ
                    </option>
                    <option value="30" className="text-slate-900">
                      ৩০ মিনিট পর বন্ধ
                    </option>
                    <option value="45" className="text-slate-900">
                      ৪৫ মিনিট পর বন্ধ
                    </option>
                  </select>
                  {sleepTimerRemaining !== null && (
                    <span className="text-emerald-400 font-mono text-[11px] ml-1">
                      {Math.floor(sleepTimerRemaining / 60)}:{String(sleepTimerRemaining % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Mute Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={isMuted ? 'আনমিউট করুন' : 'মিউট করুন'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Two-Column Reader & Chapter Navigation Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Chapters Navigation List */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3 h-fit">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-bengali flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-600" />
                  <span>অধ্যায় তালিকা ({project.chapters.length} টি)</span>
                </h4>
                <span className="text-xs text-slate-400 font-bengali">ক্লিক করে শুনুন</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {project.chapters.map((ch, idx) => {
                  const isCurrent = idx === currentChapterIndex;
                  return (
                    <button
                      key={ch.chapterNumber}
                      type="button"
                      onClick={() => {
                        setCurrentChapterIndex(idx);
                        setCurrentSentenceIndex(-1);
                        stopAudioPlayback();
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isCurrent
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 hover:border-indigo-200 text-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {ch.chapterNumber}
                          </span>
                          <p className="text-xs font-bold font-bengali line-clamp-1">{ch.title}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bengali line-clamp-1">
                          {(ch.keyThemes || []).join(' • ') || `${ch.sentences.length} টি বাক্য`}
                        </p>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-indigo-600 animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-indigo-600 animate-pulse rounded-full delay-75" />
                            <span className="w-1 h-2 bg-indigo-600 animate-pulse rounded-full delay-150" />
                          </div>
                        ) : (
                          <Play className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Vocabulary Bank if available */}
              {project.vocabularyBank && project.vocabularyBank.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-slate-700 font-bengali">📚 মূল পরিভাষা ব্যাংক:</p>
                  <div className="space-y-1.5">
                    {project.vocabularyBank.map((voc, vi) => (
                      <div key={vi} className="p-2 rounded-xl bg-slate-50 text-[11px] border border-slate-200/70">
                        <span className="font-bold text-indigo-900">{voc.term}</span>
                        <span className="text-slate-500">: {voc.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Reading & Synchronized Text Display */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 font-bengali">
                    অধ্যায় {currentChapter.chapterNumber}: {currentChapter.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-bengali mt-0.5">
                    যেকোনো বাক্যের ওপর ক্লিক করলে সরাসরি সেই বাক্য থেকেই অডিও শোনা শুরু হবে।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentChapter.audiobookText);
                      setCopiedChapterId(currentChapter.chapterNumber);
                      setTimeout(() => setCopiedChapterId(null), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    {copiedChapterId === currentChapter.chapterNumber ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>অধ্যায় কপি</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Synchronized Sentence Highlighting Area */}
              <div className="prose max-w-none text-slate-800 font-bengali text-sm sm:text-base leading-loose space-y-2">
                {currentChapter.sentences.map((sentence, sIdx) => {
                  const isCurrentSentence = currentSentenceIndex === sIdx;
                  return (
                    <span
                      key={sIdx}
                      onClick={() => handleSentenceClick(sIdx)}
                      className={`inline cursor-pointer rounded-lg px-1.5 py-0.5 transition-all duration-200 ${
                        isCurrentSentence
                          ? 'bg-amber-300/80 text-slate-950 font-bold shadow-xs ring-2 ring-amber-400'
                          : 'hover:bg-indigo-50 hover:text-indigo-900'
                      }`}
                      title="ক্লিক করে এই বাক্য থেকে শুনুন"
                    >
                      {sentence}{' '}
                    </span>
                  );
                })}
              </div>

              {/* Executive Summary Card */}
              {project.summary && (
                <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <p className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-bengali">
                    📖 সম্পূর্ণ অডিওবুকের সার্বিক সারসংক্ষেপ:
                  </p>
                  <p className="text-xs sm:text-sm text-indigo-950/80 font-bengali leading-relaxed">
                    {project.summary}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Audiobooks Modal */}
      {isSavedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderHeart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-bengali">
                    সংরক্ষিত অডিওবুক
                  </h3>
                  <span className="text-xs text-slate-500 font-bengali">
                    মোট {savedAudiobooks.length}টি অডিওবুক সংরক্ষিত আছে
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {savedAudiobooks.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 font-bengali">
                    কোনো সংরক্ষিত অডিওবুক নেই
                  </p>
                  <p className="text-xs text-slate-400 font-bengali">
                    যেকোনো অডিওবুক তৈরি করে প্লেয়ারের "সেভ করুন" বাটনে চাপ দিন।
                  </p>
                </div>
              ) : (
                savedAudiobooks.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">
                          {item.targetLanguage || 'bn'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 truncate font-bengali">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-bengali">
                        অধ্যায়: {item.chapters?.length || 0}টি • মোট বাক্য: {item.totalSentences || 0}টি
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectSavedAudiobook(item)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-bengali flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>শুনুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedAudiobook(item.id, e)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
