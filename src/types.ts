export type TranslationMode =
  | 'home'
  | 'live-voice'
  | 'earphone-interpreter'
  | 'audiobook'
  | 'conversation'
  | 'content'
  | 'learning'
  | 'text'
  | 'image'
  | 'media'
  | 'document';

export interface AudiobookChapter {
  chapterNumber: number;
  title: string;
  audiobookText: string;
  sentences: string[];
  estimatedDurationSec: number;
  keyThemes?: string[];
  studioAudioBase64?: string;
}

export interface AudiobookProject {
  id: string;
  title: string;
  authorOrSource?: string;
  sourceType: 'pdf' | 'word' | 'url' | 'text' | 'media';
  sourceFileName?: string;
  sourceUrl?: string;
  detectedSourceLang: string;
  targetLanguage: string;
  style: 'verbatim' | 'podcast' | 'deep_study';
  narratorTone: 'calm' | 'academic' | 'energetic';
  voiceGender: 'male' | 'female';
  summary: string;
  chapters: AudiobookChapter[];
  vocabularyBank?: { term: string; meaning: string; pronunciation?: string }[];
  sampleAudioBase64?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface InEarSegment {
  id: string;
  timestamp: number;
  timeFormatted: string;
  speaker: 'counterpart' | 'user';
  detectedLang: string;
  originalText: string;
  translatedText: string;
  transliteration?: string;
  audioPlayed: boolean;
  isPlaying?: boolean;
  sentimentOrTone?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export interface StudentVocabularyItem {
  word: string;
  pronunciation?: string;
  meaning: string;
  partOfSpeech?: string;
  exampleSentence?: string;
}

export interface NotebookItem {
  id: string;
  title: string;
  content: string;
  originalText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  category: 'vocabulary' | 'grammar' | 'phrase' | 'study_notes' | 'conversation';
  timestamp: number;
  tags?: string[];
}

export interface DetectedInClassQuestion {
  id: string;
  source: 'lecture' | 'conversation';
  speakerLabel: string;
  timestamp: number;
  timeFormatted?: string;
  originalQuestion: string;
  detectedLanguage: string;
  translatedQuestion: string;
  quickAnswer: string;
  detailedAnswer: string;
  answerInSpeakerLang?: string;
  transliterationSpeakerLang?: string;
  keyConcepts?: string[];
  audioBase64?: string;
}

export interface ConversationMessage {
  id: string;
  sender: 'person1' | 'person2';
  speakerName: string;
  originalText: string;
  translatedText: string;
  transliteration?: string;
  sourceLang: string;
  targetLang: string;
  voiceGender: 'male' | 'female';
  timestamp: number;
  audioBase64?: string;
  detectedQuestion?: DetectedInClassQuestion;
}

export interface SentenceAlignmentItem {
  index: number;
  original: string;
  translated: string;
  pageOrSection?: string;
  transliteration?: string;
}

export interface TranslationResult {
  id: string;
  mode: TranslationMode;
  timestamp: number;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
  originalText: string;
  translatedText: string;
  transliteration?: string;
  summary?: string;
  keyPoints?: string[];
  vocabulary?: StudentVocabularyItem[];
  studentNotes?: string;
  sections?: {
    heading?: string;
    original: string;
    translated: string;
  }[];
  sentenceAlignment?: SentenceAlignmentItem[];
  totalSentencesCount?: number;
  omissionCheckStatus?: string;
  mediaName?: string;
  mediaType?: 'audio' | 'video' | 'pdf' | 'docx' | 'text' | 'url' | 'image';
  mediaUrl?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  author?: string;
  audioDuration?: number;
}

export interface TranslationState {
  isLoading: boolean;
  progressMessage?: string;
  error?: string | null;
  currentResult: TranslationResult | null;
}

export interface MicSessionState {
  isRecording: boolean;
  isProcessing: boolean;
  interimTranscript: string;
  finalTranscript: string;
  liveTranslation: string;
  detectedLang?: string;
  error?: string | null;
}

export type LectureTranslationStyle = 'simple' | 'academic' | 'terminology' | 'bullet';

export interface LectureSegment {
  id: string;
  timestampSeconds: number;
  timeFormatted: string;
  detectedLanguage: string;
  originalText: string;
  translation: string;
  transliteration?: string;
  keyTerms?: { term: string; meaning: string }[];
  isSilence?: boolean;
  detectedQuestion?: DetectedInClassQuestion;
}

export interface LectureFullSummary {
  lectureTitle: string;
  executiveSummary: string;
  keyConcepts: string[];
  vocabularyBank: {
    term: string;
    originalLang: string;
    bengaliMeaning: string;
    contextNote: string;
  }[];
  studyQuestions: string[];
}

export type StudyLanguage = 'bn' | 'en' | 'ur' | 'ar';
export type StudyExplanationStyle = 'simple' | 'academic' | 'examples' | 'exam_prep';

export interface StudyExplanationResult {
  title: string;
  languageUsed: string;
  actionType: 'summarize' | 'explain' | 'interactive_query';
  overview: string;
  detailedExplanation: string;
  keyPoints: string[];
  realWorldExamples?: string[];
  vocabularyAndTerms?: {
    term: string;
    meaning: string;
    explanation?: string;
  }[];
  examStudyTips?: string[];
  suggestedFollowUpQuestions?: string[];
}



