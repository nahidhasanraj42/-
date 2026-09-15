import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Volume2,
  CheckCircle2,
  BookmarkPlus,
  Send,
  Sparkles,
  Layers,
  ChevronRight,
  ArrowLeft,
  Check,
  Award,
  RefreshCw,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { speakText } from '../utils/audioUtils';
import { useBackHandler } from '../utils/backNavigation';

interface LanguageLearningHubProps {
  onSaveToNotebook: (title: string, content: string, category: any, originalText?: string) => void;
}

interface LessonItem {
  id: string;
  title: string;
  level: 'root' | 'intermediate' | 'advanced';
  description: string;
  grammarNote: string;
  items: {
    target: string;
    transliteration: string;
    bengali: string;
    explanation?: string;
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

// Curriculum Data for English, Arabic, and Urdu (Root to Advanced)
const CURRICULUM: Record<'en' | 'ar' | 'ur', LessonItem[]> = {
  en: [
    {
      id: 'en-root-1',
      title: '১. ইংরেজি বর্ণমালা ও মৌলিক ধ্বনিতত্ত্ব (Alphabet & Phonics)',
      level: 'root',
      description: 'ভাওয়েল (A, E, I, O, U) এবং কনসোনেন্টের সঠিক উচ্চারণ ও সহজ প্রয়োগ।',
      grammarNote: 'ইংরেজিতে ৫টি Vowel ধ্বনি শব্দ তৈরিতে মেরুদণ্ডের মতো কাজ করে। যেমন: "Cat" (ক্যাট) বনাম "Car" (কার)।',
      items: [
        { target: 'Apple', transliteration: 'অ্যাপল', bengali: 'আপেল', explanation: 'A is for Apple' },
        { target: 'Book', transliteration: 'বুক', bengali: 'বই', explanation: 'Noun (নামবাচক পদ)' },
        { target: 'Water', transliteration: 'ওয়াটার', bengali: 'পানি / জল', explanation: 'Daily essential' },
        { target: 'Friend', transliteration: 'ফ্রেন্ড', bengali: 'বন্ধু / বান্ধবী', explanation: 'Social relation' },
      ],
      quiz: {
        question: '"বই" শব্দের ইংরেজি সঠিক রূপ কোনটি?',
        options: ['Pen', 'Book', 'Apple', 'Door'],
        correctIndex: 1,
        explanation: 'সঠিক উত্তর হলো "Book" (বুক), যার অর্থ বই।',
      },
    },
    {
      id: 'en-root-2',
      title: '২. নিত্যদিনের সম্ভাষণ ও শিষ্টাচার (Daily Greetings)',
      level: 'root',
      description: 'সকাল, দুপুর ও বিদায়বেলায় স্বাভাবিক ও মার্জিত বাক্য বিনিময়।',
      grammarNote: 'ইংরেজিতে বিনম্রতার জন্য "Please" (দয়া করে), "Thank you" (ধন্যবাদ) এবং "Excuse me" সর্বদা ব্যবহার্য।',
      items: [
        { target: 'Good morning!', transliteration: 'গুড মর্নিং!', bengali: 'শুভ সকাল!', explanation: 'সকালের অভিবাদন' },
        { target: 'How are you?', transliteration: 'হাউ আর ইউ?', bengali: 'আপনি কেমন আছেন?', explanation: 'কুশল বিনিময়' },
        { target: 'I am fine, thank you.', transliteration: 'আই অ্যাম ফাইন, থ্যাংক ইউ।', bengali: 'আমি ভালো আছি, ধন্যবাদ।', explanation: 'উত্তরে বলা' },
        { target: 'Nice to meet you!', transliteration: 'নাইস টু মিট ইউ!', bengali: 'আপনার সাথে দেখা হয়ে ভালো লাগলো!', explanation: 'প্রথম পরিচয়ে' },
      ],
      quiz: {
        question: 'কারো সাথে প্রথমবার পরিচয়ে ভদ্রভাবে কী বলা উচিত?',
        options: ['Go away', 'Nice to meet you!', 'What is this?', 'No problem'],
        correctIndex: 1,
        explanation: '"Nice to meet you!" অর্থ আপনার সাথে পরিচিত হতে পেরে ভালো লাগলো।',
      },
    },
    {
      id: 'en-int-1',
      title: '৩. বাক্য গঠন ও বর্তমান কাল (Present Tense & Sentence Structure)',
      level: 'intermediate',
      description: 'Subject + Verb + Object কাঠামোর সহজ নিয়ম ও দৈনন্দিন অভ্যাস প্রকাশ।',
      grammarNote: 'He / She / It বা কোনো একক নামের পর মূল Verb-এর সাথে s বা es যুক্ত হয় (যেমন: He speaks English)।',
      items: [
        { target: 'I want to learn English.', transliteration: 'আই ওয়ান্ট টু লার্ন ইংলিশ।', bengali: 'আমি ইংরেজি শিখতে চাই।', explanation: 'ইচ্ছা প্রকাশ' },
        { target: 'Where is the library?', transliteration: 'হোয়্যার ইজ দ্য লাইব্রেরি?', bengali: 'লাইব্রেরিটি কোথায়?', explanation: 'ঠিকানা জিজ্ঞেস করা' },
        { target: 'Can you please help me?', transliteration: 'ক্যান ইউ প্লিজ হেল্প মি?', bengali: 'আপনি কি দয়া করে আমাকে সাহায্য করতে পারেন?', explanation: 'অনুরোধ' },
        { target: 'He speaks very well.', transliteration: 'হি স্পিকস ভেরি ওয়েল।', bengali: 'সে খুব ভালো কথা বলে।', explanation: 'গুণ প্রকাশ' },
      ],
      quiz: {
        question: '"He (speak) English" বাক্যটিতে সঠিক ক্রিয়ারূপ কী হবে?',
        options: ['speaking', 'speaks', 'spoke', 'speak'],
        correctIndex: 1,
        explanation: 'He হচ্ছে Third Person Singular, তাই Verb-এর সাথে s যুক্ত হয়ে "speaks" হবে।',
      },
    },
    {
      id: 'en-adv-1',
      title: '৪. অনর্গল কথা বলা ও কর্মক্ষেত্র (Fluency & Professional Communication)',
      level: 'advanced',
      description: 'অফিসিয়াল আলোচনা, যুক্তি তুলে ধরা ও ইন্টারভিউতে সফলভাবে কথা বলার কৌশল।',
      grammarNote: 'অ্যাডভান্সড স্পিকিংয়ে সরাসরি উত্তরের বদলে "In my perspective" বা "To be honest" দিয়ে কথা শুরু করলে বক্তব্য শ্রুতিমধুর হয়।',
      items: [
        { target: 'In my perspective, consistency is the key to success.', transliteration: 'ইন মাই পারস্পেক্টিভ, কনসিস্টেন্সি ইজ দ্য কি টু সাকসেস।', bengali: 'আমার দৃষ্টিকোণ থেকে, নিয়মিত অধ্যবসায়ই সফলতার মূল চাবিকাঠি।', explanation: 'মতামত প্রকাশ' },
        { target: 'Could you elaborate on this project?', transliteration: 'কুড ইউ ইলাবোরেট অন দিস প্রজেক্ট?', bengali: 'আপনি কি এই প্রজেক্ট সম্পর্কে একটু বিস্তারিত বলবেন?', explanation: 'পেশাদার প্রশ্ন' },
        { target: 'I look forward to hearing from you soon.', transliteration: 'আই লুক ফরোয়ার্ড টু হিয়ারিং ফ্রম ইউ সুন।', bengali: 'আমি আপনার উত্তরের অপেক্ষায় রইলাম।', explanation: 'ইমেইল সমাপ্তি' },
      ],
      quiz: {
        question: 'আনুষ্ঠানিক ইমেইল বা চিঠির ইতি টানতে কোনটি সবচেয়ে উপযুক্ত?',
        options: ['Bye bye', 'I look forward to hearing from you.', 'Call me now', 'Whatever'],
        correctIndex: 1,
        explanation: '"I look forward to hearing from you." একটি চমৎকার মার্জিত পেশাদার বাক্য।',
      },
    },
  ],

  ar: [
    {
      id: 'ar-root-1',
      title: '১. আরবি বর্ণমালা ও হরকত (Arabic Alphabet & Harakat)',
      level: 'root',
      description: 'যবর (ফাথাহ), যের (কাসরাহ), পেশ (দাম্মাহ) এবং শুকুন/জযমের স্পষ্ট উচ্চারণ।',
      grammarNote: 'আরবি ডান থেকে বামে লেখা হয়। মোট ২৮টি অক্ষরের মধ্যে মাখরাজ অনুযায়ী কণ্ঠনালী, জিহ্বা ও ঠোঁটের সঠিক ব্যবহার জরুরি।',
      items: [
        { target: 'كِتَابٌ', transliteration: 'কিতাবুন', bengali: 'একটি বই', explanation: 'Noun (ইসম)' },
        { target: 'قَلَمٌ', transliteration: 'কালামুন', bengali: 'একটি কলম', explanation: 'Writing tool' },
        { target: 'بَيْتٌ', transliteration: 'বাইতুন', bengali: 'একটি ঘর / বাড়ি', explanation: 'Dwelling place' },
        { target: 'نُورٌ', transliteration: 'নূরুন', bengali: 'আলো / জ্যোতি', explanation: 'Illumination' },
      ],
      quiz: {
        question: 'আরবিতে "কলম" এর প্রতিশব্দ কী?',
        options: ['كِتَابٌ (কিতাব)', 'قَلَمٌ (কালাম)', 'بَابٌ (বাব)', 'مَاءٌ (মা)'],
        correctIndex: 1,
        explanation: '"قَلَمٌ" (কালামুন) অর্থ একটি কলম।',
      },
    },
    {
      id: 'ar-root-2',
      title: '২. দৈনন্দিন ইসলামি ও কথ্য সম্ভাষণ (Daily Greetings & Manners)',
      level: 'root',
      description: 'আরবিতে সালাম, স্বাগতম ও কুশল বিনিময়ের প্রচলিত বাক্য।',
      grammarNote: '"কেমন আছেন" পুরুষের ক্ষেত্রে "কাইফা হালুকা" (كَيْفَ حَالُكَ) এবং মহিলার ক্ষেত্রে "কাইফা হালুকি" (كَيْفَ حَالُكِ) বলা হয়।',
      items: [
        { target: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ', transliteration: 'আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ', bengali: 'আপনার উপর শান্তি ও আল্লাহর রহমত বর্ষিত হোক', explanation: 'ইসলামি অভিবাদন' },
        { target: 'أَهْلاً وَسَهْلاً', transliteration: 'আহলান ওয়া সাহলান', bengali: 'স্বাগতম!', explanation: 'Welcome' },
        { target: 'كَيْفَ حَالُكَ؟', transliteration: 'কাইফা হালুকা?', bengali: 'আপনি কেমন আছেন?', explanation: 'কুশল বিনিময়' },
        { target: 'شُكْراً جَزِيلاً', transliteration: 'শুকরান জাযিলান', bengali: 'আপনাকে অনেক ধন্যবাদ', explanation: 'কৃতজ্ঞতা জ্ঞাপন' },
      ],
      quiz: {
        question: 'আরবিতে "আপনাকে অনেক ধন্যবাদ" কীভাবে বলা হয়?',
        options: ['أَهْلاً وَسَهْلاً', 'شُكْراً جَزِيلاً', 'مَعَ السَّلَامَةِ', 'لَا بَأْسَ'],
        correctIndex: 1,
        explanation: '"شُكْراً جَزِيلاً" (শুকরান জাযিলান) অর্থ আপনাকে অনেক ধন্যবাদ।',
      },
    },
    {
      id: 'ar-int-1',
      title: '৩. জুমলা ইসমিয়্যাহ ও কথোপকথন (Nominal Sentences & Daily Conversation)',
      level: 'intermediate',
      description: 'মুক্তাদা ও খবর দিয়ে অর্থপূর্ণ বাক্য তৈরি এবং বাজারে ও মসজিদে কথোপকথন।',
      grammarNote: 'আরবিতে ক্রিয়াহীন বাক্যকে "জুমলাহ ইসমিয়্যাহ" বলে। যেমন: "আল-ইলমু নূরুন" (জ্ঞানই আলো)।',
      items: [
        { target: 'أُرِيدُ أَنْ أَتَعَلَّمَ اللُّغَةَ العَرَبِيَّةَ', transliteration: 'উরিদু আন আতাআল্লামা আল-লুগাতাল আরাবিয়্যাহ', bengali: 'আমি আরবি ভাষা শিখতে চাই', explanation: 'আকাঙ্ক্ষা প্রকাশ' },
        { target: 'أَيْنَ المَسْجِدُ مِنْ فَضْلِكَ؟', transliteration: 'আইনাল মাসজিদু মিন ফাদলিকা?', bengali: 'দয়া করে বলবেন মসজিদটি কোথায়?', explanation: 'ঠিকানা জানতে' },
        { target: 'العِلْمُ نُورٌ وَالجَهْلُ ظَلَامٌ', transliteration: 'আল-ইলমু নূরুন ওয়াল জাহলু যালাম', bengali: 'জ্ঞান হলো আলো আর অজ্ঞতা অন্ধকার', explanation: 'প্রজ্ঞাপূর্ণ বাক্য' },
      ],
      quiz: {
        question: '"أَيْنَ" (আইনা) শব্দের বাংলা অর্থ কী?',
        options: ['কেমন', 'কোথায়', 'কখন', 'কেন'],
        correctIndex: 1,
        explanation: '"أَيْنَ" (আইনা) অর্থ "কোথায়" (Where)।',
      },
    },
    {
      id: 'ar-adv-1',
      title: '৪. আল-কুরআন ও ফাসীহ আরবি (Quranic & Classical Arabic Eloquence)',
      level: 'advanced',
      description: 'কুরআনিক শব্দমূল (রুট ট্রাই-লেটার), বালাগাত ও বিশুদ্ধ উচ্চাঙ্গ আরবি বক্তব্য।',
      grammarNote: 'আরবি শব্দের বেশিরভাগই ৩টি মূল অক্ষর (রুট) থেকে উৎপন্ন হয়, যেমন ক-ত-ব থেকে কিতাব, কাতিব, মাকতাব।',
      items: [
        { target: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', transliteration: 'ইন্না মাআল উসরি ইউসরা', bengali: 'নিশ্চয়ই কষ্টের সাথেই রয়েছে স্বস্তি।', explanation: 'সূরা আল-ইনশিরাহ' },
        { target: 'طَلَبُ العِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ', transliteration: 'ত্বলাবুল ইলমি ফারিদাতুন আলা কুল্লি মুসলিম', bengali: 'জ্ঞান অর্জন করা প্রত্যেক মুসলমানের উপর ফরজ।', explanation: 'হাদিস শরিফ' },
      ],
      quiz: {
        question: '"العُسْرُ" (আল-উসর) এর বিপরীত শব্দ কোনটি?',
        options: ['الظُّلْمُ (অন্যায়)', 'اليُسْرُ (সহজ/স্বস্তি)', 'اللَّيْلُ (রাত)', 'الحَرْبُ (যুদ্ধ)'],
        correctIndex: 1,
        explanation: '"العُسْرُ" (কঠিন/কষ্ট) এর বিপরীত শব্দ হলো "اليُسْرُ" (সহজ/স্বস্তি)।',
      },
    },
  ],

  ur: [
    {
      id: 'ur-root-1',
      title: '১. উর্দু বর্ণমালা ও মৌলিক শব্দ (Urdu Alphabet & Basic Vocabulary)',
      level: 'root',
      description: 'আলিফ, বে, পে থেকে ইয়ে পর্যন্ত উর্দু বর্ণমালার ধ্বনি এবং বাংলা অর্থ।',
      grammarNote: 'উর্দু নাস্তালিক লিপিতে লেখা হয় এবং এটি বাংলা ও আরবি-ফারসি ভাষার সাথে গভীরভাবে সম্পর্কিত।',
      items: [
        { target: 'کتاب', transliteration: 'কিতাব', bengali: 'বই', explanation: 'বাংলাতেও একই শব্দ' },
        { target: 'پانی', transliteration: 'পানি', bengali: 'পানি / জল', explanation: 'নিত্য প্রয়োজনীয়' },
        { target: 'دوست', transliteration: 'দোস্ত', bengali: 'বন্ধু', explanation: 'সম্পর্ক' },
        { target: 'محبت', transliteration: 'মোহাব্বত', bengali: 'ভালোবাসা / মায়া', explanation: 'অনুভূতি' },
      ],
      quiz: {
        question: 'উর্দুতে "পানি" কীভাবে লেখা হয়?',
        options: ['کتاب', 'پانی', 'دوست', 'شہر'],
        correctIndex: 1,
        explanation: 'উর্দুতে "پانی" (পানি) লেখা হয়, যা হুবহু বাংলায় পানি।',
      },
    },
    {
      id: 'ur-root-2',
      title: '২. আদব-কায়দা ও কুশল বিনিময় (Etiquette & Greetings in Urdu)',
      level: 'root',
      description: 'আদাব, আপ ক্যায়সে হ্যায় এবং সম্মানিত সম্ভাষণ।',
      grammarNote: 'উর্দুতে সম্মানের জন্য সর্বনাম "আপ" (آپ) ব্যবহার করা হয় এবং ক্রিয়ার শেষে "হ্যায়" বা "হ্যায়ঁ" বসে।',
      items: [
        { target: 'آداب عرض ہے', transliteration: 'আদাব আরয হ্যায়', bengali: 'সম্মান প্রদর্শন করছি / নমস্কার', explanation: 'উর্দু ঐতিহ্যবাহী সম্ভাষণ' },
        { target: 'آپ کیسے ہیں؟', transliteration: 'আপ ক্যায়সে হ্যায়?', bengali: 'আপনি কেমন আছেন?', explanation: 'কুশল বিনিময়' },
        { target: 'میں ٹھیک ہوں، شکریہ', transliteration: 'ম্যায় ঠিক হুঁ, শুকরিয়া', bengali: 'আমি ভালো আছি, ধন্যবাদ', explanation: 'উত্তরে বলা' },
        { target: 'بہت بہت شکریہ', transliteration: 'বহুত বহুত শুকরিয়া', bengali: 'অনেক অনেক ধন্যবাদ', explanation: 'কৃতজ্ঞতা' },
      ],
      quiz: {
        question: 'উর্দুতে "আপনি কেমন আছেন?" কীভাবে জিজ্ঞেস করবেন?',
        options: ['آپ کا نام کیا ہے؟', 'آپ کیسے ہیں؟', 'کہاں جا رہے ہو؟', 'کوئی بات نہیں'],
        correctIndex: 1,
        explanation: '"آپ کیسے ہیں؟" (আপ ক্যায়সে হ্যায়?) অর্থ আপনি কেমন আছেন?',
      },
    },
    {
      id: 'ur-int-1',
      title: '৩. দৈনন্দিন উর্দু বাক্য ও ব্যাকরণ (Daily Urdu Conversation)',
      level: 'intermediate',
      description: 'বাস্তব জীবনের কথোপকথন, কেনাকাটা ও পরিচয় প্রদানের চমৎকার বাক্যমালা।',
      grammarNote: 'উর্দু বাক্যে ক্রিয়া সর্বদা বাক্যের শেষে বসে (যেমন: "ম্যায় উর্দু শিখ রাহা হুঁ")।',
      items: [
        { target: 'مجھے اردو زبان بہت پسند ہے', transliteration: 'মুঝে উর্দু জবান বহুত পসন্দ হ্যায়', bengali: 'আমার উর্দু ভাষা খুব পছন্দ', explanation: 'পছন্দ প্রকাশ' },
        { target: 'اس کی قیمت کیا ہے؟', transliteration: 'ইস কি কিমাত কেয়া হ্যায়?', bengali: 'এটির দাম কত?', explanation: 'দোকানে প্রশ্ন' },
        { target: 'کیا آپ میری مدد کر سکتے ہیں؟', transliteration: 'কেয়া আপ মেরি মাদাদ কার সাকতে হ্যায়?', bengali: 'আপনি কি আমাকে সাহায্য করতে পারেন?', explanation: 'অনুরোধ' },
      ],
      quiz: {
        question: 'দোকানে কোনো জিনিসের দাম জানতে উর্দুতে কী বলবেন?',
        options: ['آپ کہاں ہیں؟', 'اس کی قیمت کیا ہے؟', 'میرا نام احمد ہے', 'پانی پلاؤ'],
        correctIndex: 1,
        explanation: '"اس کی قیمت کیا ہے؟" অর্থ এটির দাম কত?',
      },
    },
    {
      id: 'ur-adv-1',
      title: '৪. উর্দু শায়েরী ও উচ্চাঙ্গ সাহিত্য (Urdu Poetry & Classic Expression)',
      level: 'advanced',
      description: 'মির্জা গালিব, আল্লামা ইকবালের প্রাঞ্জল উর্দু কাব্য ও মননশীল প্রকাশভঙ্গি।',
      grammarNote: 'উর্দু সাহিত্যে "ইযাফত" (যেমন: "দিল-এ-নাদান") শব্দের সৌন্দর্য বহুগুণে বৃদ্ধি করে।',
      items: [
        { target: 'سارے جہاں سے اچھا ہندوستاں ہمارا', transliteration: 'সারে জাঁহা সে আচ্ছা হিন্দোস্তাঁ হামারা', bengali: 'গোটা বিশ্বের চেয়ে সুন্দর আমাদের এই জন্মভূমি', explanation: 'আল্লামা ইকবাল' },
        { target: 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے', transliteration: 'হাযারোঁ খোয়াহিশেঁ এইসি কে হার খোয়াহিশ পে দাম নিকলে', bengali: 'হাজারো এমন আকুল বাসনা, যার প্রতিটি পূরণে প্রাণ ওষ্ঠাগত হয়', explanation: 'মির্জা গালিব' },
      ],
      quiz: {
        question: 'উর্দুতে "বাসনা বা ইচ্ছা" এর সুপরিচিত কাব্যিক প্রতিশব্দ কোনটি?',
        options: ['خواہش (খোয়াহিশ)', 'پہاڑ (পাহাড়)', 'سمندر (সমুদ্র)', 'قلم (কলম)'],
        correctIndex: 0,
        explanation: '"خواہش" (খোয়াহিশ) অর্থ আন্তরিক ইচ্ছা বা বাসনা।',
      },
    },
  ],
};

export const LanguageLearningHub: React.FC<LanguageLearningHubProps> = ({ onSaveToNotebook }) => {
  const [selectedLang, setSelectedLang] = useState<'en' | 'ar' | 'ur'>('en');
  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(CURRICULUM.en[0]);

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // AI Language Tutor Interactive Chat state
  const [tutorMessage, setTutorMessage] = useState('');
  const [tutorHistory, setTutorHistory] = useState<
    { sender: 'user' | 'tutor'; text: string; sub?: string }[]
  >([
    {
      sender: 'tutor',
      text: 'স্বাগতম! আমি আপনার ব্যক্তিগত AI ভাষা শিক্ষক। ইংরেজি, আরবি বা উর্দুতে যেকোনো বাক্য লিখে পাঠান, আমি তার শুদ্ধ উচ্চারণ, অর্থ ও ব্যাকরণ বাংলায় বুঝিয়ে দেবো!',
    },
  ]);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [savedVocabId, setSavedVocabId] = useState<string | null>(null);

  const lessons = CURRICULUM[selectedLang] || [];

  // Device back button: if quiz submitted or non-first lesson viewed, step back inside hub
  useBackHandler(
    () => {
      if (quizSubmitted) {
        setQuizSubmitted(false);
        setSelectedAnswer(null);
        return true;
      }
      if (activeLesson && activeLesson.id !== CURRICULUM[selectedLang][0]?.id) {
        setActiveLesson(CURRICULUM[selectedLang][0]);
        setSelectedAnswer(null);
        setQuizSubmitted(false);
        return true;
      }
      return false;
    },
    25,
    quizSubmitted || (activeLesson !== null && activeLesson.id !== CURRICULUM[selectedLang][0]?.id),
    'learning-hub-subview'
  );

  const handleSelectLang = (lang: 'en' | 'ar' | 'ur') => {
    setSelectedLang(lang);
    setActiveLesson(CURRICULUM[lang][0]);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const handleSelectLesson = (lesson: LessonItem) => {
    setActiveLesson(lesson);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer !== null) {
      setQuizSubmitted(true);
    }
  };

  const handleSaveWordToNotebook = (item: { target: string; transliteration: string; bengali: string }) => {
    onSaveToNotebook(
      item.target,
      `উচ্চারণ: ${item.transliteration}\nঅর্থ: ${item.bengali}`,
      'vocabulary',
      item.target
    );
    setSavedVocabId(item.target);
    setTimeout(() => setSavedVocabId(null), 2000);
  };

  // Send message to AI Language Tutor
  const handleSendToTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorMessage.trim() || isTutorLoading) return;

    const userText = tutorMessage.trim();
    setTutorMessage('');
    setTutorHistory((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsTutorLoading(true);

    try {
      const response = await fetch('/api/learning/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLang,
          level: activeLesson?.level || 'root',
          topic: activeLesson?.title || 'general',
          action: 'tutor_chat',
          userMessage: userText,
        }),
      });

      if (!response.ok) throw new Error('AI টিউটর উত্তর দিতে পারেনি।');
      const data = await response.json();

      let replyText = data.tutorResponseBn || 'চমৎকার অনুশীলন!';
      let subInfo = '';
      if (data.sampleTargetPhrase) {
        subInfo = `নমুনা বাক্য: ${data.sampleTargetPhrase} (${data.transliteration || ''}) - ${data.meaningBn || ''}`;
      }
      if (data.nextPracticePrompt) {
        replyText += `\n\n💡 পরবর্তী চ্যালেঞ্জ: ${data.nextPracticePrompt}`;
      }

      setTutorHistory((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: replyText,
          sub: subInfo,
        },
      ]);
    } catch (err: any) {
      setTutorHistory((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'দুঃখিত, ইন্টারনেট বা সার্ভারে সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        },
      ]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-bengali flex items-center gap-2">
                <span>বহুভাষিক ভাষা শিক্ষা একাডেমি</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  রুট থেকে অ্যাডভান্সড
                </span>
              </h3>
            </div>
          </div>

          {/* Language Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleSelectLang('en')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedLang === 'en'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇬🇧</span>
              <span>ইংরেজি শিক্ষা</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectLang('ar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedLang === 'ar'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇸🇦</span>
              <span>আরবি শিক্ষা</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectLang('ur')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedLang === 'ur'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇵🇰</span>
              <span>উর্দু শিক্ষা</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Lesson Pathway */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {lessons.map((lesson, idx) => {
            const isSelected = activeLesson?.id === lesson.id;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => handleSelectLesson(lesson)}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      পাঠ {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        lesson.level === 'root'
                          ? 'bg-blue-100 text-blue-800'
                          : lesson.level === 'intermediate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {lesson.level === 'root' && 'রুট লেভেল'}
                      {lesson.level === 'intermediate' && 'ইন্টারমিডিয়েট'}
                      {lesson.level === 'advanced' && 'অ্যাডভান্সড'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 font-bengali line-clamp-2">
                    {lesson.title}
                  </h4>
                </div>

                <div className="flex items-center text-[11px] font-semibold text-emerald-800">
                  <span>অনুশীলন শুরু করুন</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Lesson Content Container */}
      {activeLesson && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Lesson Content (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Grammar & Overview Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  পাঠের উদ্দেশ্য ও নিয়ম
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {selectedLang === 'en' ? 'ইংরেজি' : selectedLang === 'ar' ? 'আরবি' : 'উর্দু'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 font-bengali">
                {activeLesson.title}
              </h2>
              <p className="text-xs text-slate-600 font-bengali leading-relaxed">
                {activeLesson.description}
              </p>

              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 font-bengali space-y-1">
                <strong className="block font-bold text-amber-900">💡 ব্যাকরণ ও গঠন কৌশল:</strong>
                <p>{activeLesson.grammarNote}</p>
              </div>
            </div>

            {/* Interactive Flashcards / Word Breakdown */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 font-bengali flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>গুরুত্বপূর্ণ শব্দ ও বাক্যমালা (উচ্চারণসহ)</span>
                </h3>
                <span className="text-xs text-slate-400 font-bengali">উচ্চারণ শুনতে স্পিকার আইকন চাপুন</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeLesson.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900 font-arabic">
                          {item.target}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => speakText(item.target, selectedLang)}
                            className="p-1.5 rounded-lg bg-white shadow-2xs hover:bg-emerald-600 hover:text-white text-slate-600 transition-colors"
                            title="উচ্চারণ শুনুন"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveWordToNotebook(item)}
                            className="p-1.5 rounded-lg bg-white shadow-2xs hover:bg-emerald-600 hover:text-white text-slate-600 transition-colors"
                            title="নোটবুকে সংরক্ষণ করুন"
                          >
                            {savedVocabId === item.target ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 italic mt-1">
                        উচ্চারণ: {item.transliteration}
                      </div>
                      <div className="text-sm font-bold text-emerald-900 font-bengali mt-1">
                        {item.bengali}
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="text-[11px] text-slate-400 border-t border-slate-200/60 pt-2">
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Interactive Quiz */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 font-bengali flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>স্মার্ট কুইজ ও আত্মযাচাই</span>
                </h3>
                <span className="text-xs text-slate-400 font-bengali">প্রতিটি পাঠ শেষে যাচাই</span>
              </div>

              <p className="text-sm font-bold text-slate-800 font-bengali">
                প্রশ্ন: {activeLesson.quiz.question}
              </p>

              <div className="space-y-2">
                {activeLesson.quiz.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === activeLesson.quiz.correctIndex;

                  let optionStyle = 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700';
                  if (quizSubmitted) {
                    if (isCorrect) optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    else if (isSelected && !isCorrect) optionStyle = 'border-red-400 bg-red-50 text-red-900 line-through';
                  } else if (isSelected) {
                    optionStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={quizSubmitted}
                      onClick={() => setSelectedAnswer(idx)}
                      className={`w-full p-3.5 rounded-2xl text-left text-xs border transition-all flex items-center justify-between ${optionStyle}`}
                    >
                      <span>{option}</span>
                      {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                {!quizSubmitted ? (
                  <button
                    type="button"
                    onClick={handleQuizSubmit}
                    disabled={selectedAnswer === null}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    উত্তর জমা দিন
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswer(null);
                      setQuizSubmitted(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>আবার পরীক্ষা দিন</span>
                  </button>
                )}

                {quizSubmitted && (
                  <p className="text-xs text-slate-600 font-bengali">
                    {activeLesson.quiz.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Language Tutor Interactive Chat (Right col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-bengali">AI ভাষা শিক্ষক</h4>
                    <span className="text-[10px] text-emerald-600 font-semibold">সর্বদা সক্রিয়</span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {selectedLang.toUpperCase()} টিউটর
                </span>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[380px]">
                {tutorHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs max-w-[90%] leading-relaxed ${
                        item.sender === 'user'
                          ? 'bg-emerald-800 text-white rounded-tr-xs'
                          : 'bg-slate-100 text-slate-800 rounded-tl-xs font-bengali'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{item.text}</p>
                      {item.sub && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200/80 text-[11px] font-bold text-emerald-900 font-arabic">
                          {item.sub}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTutorLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>শিক্ষক বিশ্লেষণ করছেন...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendToTutor} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={tutorMessage}
                  onChange={(e) => setTutorMessage(e.target.value)}
                  placeholder="এখানে বাক্য লিখুন বা প্রশ্ন করুন..."
                  disabled={isTutorLoading}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!tutorMessage.trim() || isTutorLoading}
                  className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
