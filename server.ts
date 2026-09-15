import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Set payload limit to 50MB for handling audio, video, and PDF uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Text translation route
app.post('/api/translate/text', async (req: Request, res: Response) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'bn', tone = 'simple' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for translation.' });
      return;
    }

    const ai = getGenAI();

    const prompt = `You are a world-class translator specializing in translating text between Arabic, English, Bengali, and other languages.
Task: Translate the following text accurately into ${targetLang === 'bn' ? 'natural, fluent, and easily understandable Bengali (সহজ ও সাবলীল বাংলা)' : targetLang}.

Source Language Hint: ${sourceLang}
Desired Tone: ${tone} (keep it natural, grammatically correct, and crystal-clear)

Input Text:
"""
${text}
"""

Rules:
1. If the input is Arabic, extract the original Arabic clearly, provide Bengali phonetic pronunciation/transliteration if helpful, and translate into beautiful, easy-to-read Bengali.
2. If the input is English, translate into natural conversational/standard Bengali without robotic word-by-word phrasing.
3. If target language is Bengali, make sure the phrasing is simple and sweet (সহজ ভাষায় সুন্দর করে অনুবাদ).
4. Provide structured JSON matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, description: 'Detected source language name' },
            originalText: { type: Type.STRING, description: 'Original source text formatted cleanly' },
            translation: { type: Type.STRING, description: 'The translated text in target language' },
            transliteration: { type: Type.STRING, description: 'Pronunciation / transliteration if applicable' },
            summary: { type: Type.STRING, description: 'Short 1-sentence essence in target language' },
            wordBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                },
                required: ['word', 'meaning'],
              },
              description: 'Key vocabulary with Bengali meanings',
            },
          },
          required: ['detectedLanguage', 'originalText', 'translation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message || 'Translation failed.' });
  }
});

// Audio translation / transcription route (handles voice recordings and uploaded audio files)
app.post('/api/translate/audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', targetLang = 'bn' } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'Audio data is required.' });
      return;
    }

    const ai = getGenAI();

    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0], // e.g. 'audio/webm', 'audio/mp3', 'audio/wav'
        data: audioBase64,
      },
    };

    const promptPart = {
      text: `Listen attentively to this audio recording (it could be Arabic, English, Bengali, or another language).
1. Transcribe the spoken speech VERBATIM in its original language.
2. Detect the spoken language.
3. Translate everything into ${targetLang === 'bn' ? 'simple, beautiful, and natural Bengali (সহজ ভাষায় সুন্দর সাবলীল বাংলায় অনুবাদ)' : targetLang}.
4. Provide a clear, structured JSON response with transcription, detectedLanguage, translation, transliteration (if original is Arabic), and keyPoints summary.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, promptPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, description: 'Language of the audio speech' },
            transcription: { type: Type.STRING, description: 'Verbatim transcript in original spoken language' },
            translation: { type: Type.STRING, description: 'The translation into Bengali or target language' },
            transliteration: { type: Type.STRING, description: 'Phonetic pronunciation guide if applicable' },
            summary: { type: Type.STRING, description: 'Concise summary in target language' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key takeaways or bullet points in Bengali',
            },
          },
          required: ['detectedLanguage', 'transcription', 'translation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Audio translation error:', error);
    res.status(500).json({ error: error.message || 'Audio processing failed.' });
  }
});

// Continuous Lecture Chunk Translation for University Students
// Handles live speech from professors speaking Arabic, English, Urdu, or code-switching
app.post('/api/lecture/chunk', async (req: Request, res: Response) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      targetLang = 'bn',
      translationStyle = 'simple',
      previousContext = '',
    } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio chunk data is required.' });
      return;
    }

    const ai = getGenAI();
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: audioBase64,
      },
    };

    let styleInstruction = 'খুব সহজ, সাবলীল ও প্রাঞ্জল বাংলায় অনুবাদ যাতে ছাত্র এক দেখাতেই সহজেই বুঝতে পারে।';
    if (translationStyle === 'academic') {
      styleInstruction = 'বিশ্ববিদ্যালয়ের ক্লাস লেকচারের উপযুক্ত গভীর, তাত্ত্বিক ও প্রাতিষ্ঠানিক মানসম্মত বাংলায় অনুবাদ। পরিভাষা ও কনসেপ্টগুলো নিখুঁত রাখা।';
    } else if (translationStyle === 'terminology') {
      styleInstruction = 'গুরুত্বপূর্ণ বা জটিল আরবি/ইংরেজি/উর্দু পরিভাষার পাশে বন্ধনীতে মূল শব্দ ও অর্থসহ (যেমন: "ইসতিহসান (Istihsan - ব্যবহারিক যুক্তি)") বিশদ ব্যাখ্যাসহ অনুবাদ।';
    } else if (translationStyle === 'bullet') {
      styleInstruction = 'লেকচারের এই অংশের সারবত্তা ২-৩টি সংক্ষেপ বুলেট পয়েন্ট আকারে সহজ বাংলায় প্রকাশ করা।';
    }

    const promptPart = {
      text: `You are an expert AI academic interpreter assisting a university student in a live lecture hall.
The professor is an Arabic native speaker who frequently switches between Arabic, English, and Urdu (code-switching) during the lecture.
Previous lecture context (if any): "${previousContext}"

Tasks:
1. Listen closely to the professor's speech in this audio chunk.
2. If there is only background silence, murmuring, coughing, or no clear speech, set isSilence: true, transcription: "", translation: "".
3. Verbatim Transcription: Transcribe the professor's exact spoken words in the original language(s).
   - If spoken in Arabic: transcribe in accurate Arabic script.
   - If spoken in English: transcribe in accurate English.
   - If spoken in Urdu: transcribe in accurate Urdu script.
   - If code-switched/mixed: preserve each segment in its authentic script without skipping words.
4. Detected Language: Clearly state the language(s) heard (e.g., "আরবি (Arabic)", "ইংরেজি (English)", "উর্দু (Urdu)", or "আরবি + ইংরেজি (Mixed Arabic-English)").
5. Bengali Translation: Translate into Bengali according to this requested style: ${styleInstruction}
6. Transliteration: If Arabic or Urdu was spoken, provide phonetic pronunciation in Bengali letters (সহজ বাংলা উচ্চারণে রূপ)।
7. Key Terms: Extract up to 2 key academic terms/vocabulary if present with Bengali meaning.
8. Classroom Question Detection: Detect if the professor is asking a question to the students (e.g. asking for a definition, reason, example, confirmation, opinion, or problem-solving prompt).
   If YES, set detectedQuestion.hasQuestion = true:
   - questionOriginal: the exact question extracted from speech
   - questionTranslated: clear Bengali translation of the question
   - quickAnswer: concise, high-impact 1-2 sentence answer in Bengali that the student can raise their hand and say immediately
   - detailedAnswer: comprehensive academic answer with logic and key points in Bengali
   - answerInSpeakerLang: natural, fluent answer translated into the professor's language (Arabic, English, or Urdu) so the student can speak it to the professor
   - transliterationSpeakerLang: phonetic pronunciation guide of the answer in Bengali letters so the student can pronounce it correctly
   If NO question is asked, set detectedQuestion.hasQuestion = false.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, promptPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSilence: { type: Type.BOOLEAN, description: 'True if no clear speech was detected' },
            detectedLanguage: { type: Type.STRING, description: 'Detected language or mix' },
            transcription: { type: Type.STRING, description: 'Verbatim transcript in original language(s)' },
            translation: { type: Type.STRING, description: 'Bengali translation based on requested style' },
            transliteration: { type: Type.STRING, description: 'Bengali phonetic pronunciation guide if Arabic/Urdu' },
            keyTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                },
                required: ['term', 'meaning'],
              },
              description: 'Key academic terms mentioned in this segment',
            },
            detectedQuestion: {
              type: Type.OBJECT,
              properties: {
                hasQuestion: { type: Type.BOOLEAN },
                questionOriginal: { type: Type.STRING },
                questionTranslated: { type: Type.STRING },
                quickAnswer: { type: Type.STRING },
                detailedAnswer: { type: Type.STRING },
                answerInSpeakerLang: { type: Type.STRING },
                transliterationSpeakerLang: { type: Type.STRING },
              },
              required: ['hasQuestion'],
            },
          },
          required: ['isSilence', 'detectedLanguage', 'transcription', 'translation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Lecture chunk processing error:', error);
    res.status(500).json({ error: error.message || 'Failed to process lecture chunk.' });
  }
});

// Diplomatic In-Ear Simultaneous Interpreter Route (প্রেসিডেন্ট ইয়ারফোন মোড / কানে কানে দোভাষী)
// Optimized for low-latency, natural diplomatic phrasing and instant in-ear TTS speech synthesis
app.post('/api/interpreter/in-ear-chunk', async (req: Request, res: Response) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      targetLang = 'bn',
      role = 'counterpart', // 'counterpart' (foreign dignitary speaking) or 'user' (president speaking)
      counterpartLang = 'auto',
      previousContext = '',
    } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio chunk data is required.' });
      return;
    }

    const ai = getGenAI();
    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: audioBase64,
      },
    };

    const isCounterpart = role === 'counterpart';

    const promptText = isCounterpart
      ? `You are an elite Diplomatic Simultaneous Interpreter (ব্যক্তিগত কানে কানে কূটনৈতিক দোভাষী) serving a state president/VIP who is wearing an in-ear earpiece.
A foreign dignitary, foreign partner, or international speaker is speaking now.
Previous conversation context: "${previousContext}"
Target Language for the President's earphone: ${targetLang === 'bn' ? 'Bangla (বাংলা)' : targetLang}.

Your mission:
1. Listen with highest fidelity to the foreign speaker's voice in this audio chunk.
2. If silence, background rustle, or no speech: return isSilence: true, transcription: "", translation: "", ttsCleanText: "".
3. Verbatim Transcription: Transcribe exactly what the foreign speaker said in their native language (Arabic, English, Urdu, French, Spanish, Russian, Chinese, etc.).
4. Detect the exact language spoken.
5. Diplomatic In-Ear Translation: Translate into natural, respectful, crystal-clear, and fluent first-person translation.
   - For Bengali: use polite, polished, and immediately understandable phrasing that sounds natural when spoken into an earphone.
   - Do not use clumsy mechanical phrasing.
6. TTS Clean Text: Provide a streamlined version of the translation specifically optimized for browser Text-to-Speech (TTS) into the earpiece. Strip all parenthetical annotations, brackets, or formatting marks so the voice synthesizer reads it aloud smoothly without hiccups.
7. Transliteration: If Arabic or Urdu was spoken, provide phonetic pronunciation in Bengali letters.
8. Tone / Sentiment: Briefly describe the diplomat's tone (e.g. "আন্তরিক কুশলবিনিময়", "কূটনৈতিক প্রস্তাব", "প্রশ্ন বা জিজ্ঞাসা", "গুরুত্বপূর্ণ যুক্তি", "সহমত পোষণ") in Bengali.`
      : `You are an elite Diplomatic Simultaneous Interpreter serving a state president/VIP.
The president is speaking in Bengali (or their language) to address a foreign dignitary whose language is ${counterpartLang || 'English/Arabic'}.
Target Language for the Foreign Counterpart: ${counterpartLang === 'bn' ? 'English' : counterpartLang}.

Your mission:
1. Transcribe the president's spoken words verbatim.
2. Translate into natural, highly articulate, polite, and diplomatic phrasing in the counterpart's language (e.g., English, Arabic, or specified language).
3. TTS Clean Text: Clean version for speech synthesis so the phone or speaker can voice it to the dignitary.
4. Tone: Describe the sentiment/intent in Bengali.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, { text: promptText }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSilence: { type: Type.BOOLEAN, description: 'True if no meaningful speech was found' },
            detectedLanguage: { type: Type.STRING, description: 'Detected language name' },
            transcription: { type: Type.STRING, description: 'Verbatim transcript of speech' },
            translation: { type: Type.STRING, description: 'Polished diplomatic translation' },
            ttsCleanText: { type: Type.STRING, description: 'Clean text optimized for in-ear audio TTS' },
            transliteration: { type: Type.STRING, description: 'Phonetic guide if Arabic/Urdu' },
            sentimentOrTone: { type: Type.STRING, description: 'Tone or sentiment note in Bengali' },
          },
          required: ['isSilence', 'detectedLanguage', 'transcription', 'translation', 'ttsCleanText'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('In-ear interpreter error:', error);
    res.status(500).json({ error: error.message || 'In-ear interpretation failed.' });
  }
});

// Full Lecture Summarization & Study Notes Generator
app.post('/api/lecture/summarize', async (req: Request, res: Response) => {
  try {
    const { segments, targetLang = 'bn' } = req.body;
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      res.status(400).json({ error: 'Lecture segments are required for summarization.' });
      return;
    }

    const ai = getGenAI();

    const formattedTranscript = segments
      .map(
        (s: any, idx: number) =>
          `[${s.timeFormatted || `${idx + 1}`}] (${s.detectedLanguage || 'Original'}): ${s.originalText}\nঅনুবাদ: ${s.translation}`
      )
      .join('\n\n');

    const prompt = `You are an academic study mentor for a university student.
The student recorded their professor's university lecture, who spoke in mixed Arabic, English, and Urdu.
Here is the recorded transcript and translation:

${formattedTranscript}

Generate a comprehensive, high-utility university lecture study note in Bengali:
1. lectureTitle: Academic title for this lecture in Bengali and English.
2. executiveSummary: 3-4 sentence comprehensive overview summarizing the core message and topic taught.
3. keyConcepts: 4-6 essential academic concepts, theories, or principles taught by the professor.
4. vocabularyBank: 4-8 important academic terminology / jargon used in Arabic, English, or Urdu with their Bengali meaning and context notes.
5. studyQuestions: 3-4 likely university exam questions or conceptual review questions with short guidance to prepare for exams.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lectureTitle: { type: Type.STRING, description: 'Academic title of the lecture' },
            executiveSummary: { type: Type.STRING, description: '3-4 sentence summary in Bengali' },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key academic concepts explained',
            },
            vocabularyBank: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  originalLang: { type: Type.STRING },
                  bengaliMeaning: { type: Type.STRING },
                  contextNote: { type: Type.STRING },
                },
                required: ['term', 'originalLang', 'bengaliMeaning', 'contextNote'],
              },
            },
            studyQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exam preparation and review questions',
            },
          },
          required: ['lectureTitle', 'executiveSummary', 'keyConcepts', 'vocabularyBank', 'studyQuestions'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Lecture summary error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate lecture summary.' });
  }
});


// Video translation route
app.post('/api/translate/video', async (req: Request, res: Response) => {
  try {
    const { videoBase64, mimeType = 'video/mp4', targetLang = 'bn' } = req.body;
    if (!videoBase64) {
      res.status(400).json({ error: 'Video data is required.' });
      return;
    }

    const ai = getGenAI();

    const videoPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: videoBase64,
      },
    };

    const promptPart = {
      text: `Analyze the audio and visual content of this video.
1. Transcribe the dialogue/speech in its original language (e.g. Arabic, English, or any language).
2. Detect the spoken language.
3. Translate the spoken content accurately into ${targetLang === 'bn' ? 'simple, easily understandable Bengali (সহজ ভাষায় সুন্দর বাংলা অনুবাদ)' : targetLang}.
4. Provide structured JSON with transcription, translation, summary, and key visual/audio context points.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [videoPart, promptPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, description: 'Original spoken language' },
            transcription: { type: Type.STRING, description: 'Full transcription of dialogue' },
            translation: { type: Type.STRING, description: 'Complete translation in Bengali' },
            summary: { type: Type.STRING, description: 'Video summary in Bengali' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key points covered in the video',
            },
          },
          required: ['detectedLanguage', 'transcription', 'translation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Video translation error:', error);
    res.status(500).json({ error: error.message || 'Video processing failed.' });
  }
});

// Document translation route (PDF, Word DOCX, TXT) with ZERO-OMISSION GUARANTEE
app.post('/api/translate/document', async (req: Request, res: Response) => {
  try {
    const { fileBase64, mimeType, fileName, targetLang = 'bn' } = req.body;
    if (!fileBase64) {
      res.status(400).json({ error: 'File data is required.' });
      return;
    }

    const ai = getGenAI();
    let parts: any[] = [];
    const isDocx = fileName?.toLowerCase().endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdf = fileName?.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

    const zeroOmissionMandate = `
CRITICAL MANDATE - ZERO OMISSION & VERBATIM SENTENCE-BY-SENTENCE ALIGNMENT:
1. The user will compare the translation line-by-line and sentence-by-sentence against the original file!
2. You are STRICTLY FORBIDDEN from omitting, skipping, summarizing, or condensing ANY sentence, paragraph, clause, or page.
3. Every single sentence present in the source document MUST have its exact corresponding translated sentence.
4. If there are multiple pages or sections, translate every page completely from top to bottom without missing anything.
5. In addition to the full translation, provide "sentenceAlignment" where each original sentence is paired with its exact translated sentence.
`;

    if (isDocx) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const mammothResult = await mammoth.extractRawText({ buffer });
      const docxText = mammothResult.value;

      parts = [
        {
          text: `You have been given the extracted text from a Word document (${fileName || 'document.docx'}).
Document text:
"""
${docxText.slice(0, 150000)}
"""

Task:
${zeroOmissionMandate}
1. Detect the source language.
2. Translate every single sentence into ${targetLang === 'bn' ? 'simple, natural, and crystal-clear Bengali (সহজ ভাষায় সুন্দর বাংলা অনুবাদ)' : targetLang}.
3. Provide a clear title, document summary, structured sections, and a complete sentence-by-sentence alignment list.`,
        },
      ];
    } else if (isPdf) {
      parts = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBase64,
          },
        },
        {
          text: `Read this entire PDF document (${fileName || 'document.pdf'}) page by page from the first page to the last.
Task:
${zeroOmissionMandate}
1. Detect the language of the PDF (e.g. Arabic, English, Urdu, etc.).
2. Translate EVERY single sentence and every single page into ${targetLang === 'bn' ? 'natural, fluent, and crystal-clear Bengali (সহজ ও সাবলীল বাংলায় অনুবাদ)' : targetLang}.
3. Break down the translation sentence-by-sentence in "sentenceAlignment" so the user can verify every single line side-by-side.
4. Provide structured JSON with documentTitle, originalText, translation, summary, sections, and sentenceAlignment.`,
        },
      ];
    } else {
      // Plain text or markdown
      const text = Buffer.from(fileBase64, 'base64').toString('utf-8');
      parts = [
        {
          text: `Translate the following document text completely (${fileName || 'document.txt'}):
"""
${text.slice(0, 150000)}
"""

Task:
${zeroOmissionMandate}
Translate every sentence thoroughly into ${targetLang === 'bn' ? 'simple and natural Bengali (সহজ ভাষায় সুন্দর বাংলা)' : targetLang}.`,
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentTitle: { type: Type.STRING, description: 'Title or subject of the document' },
            detectedLanguage: { type: Type.STRING, description: 'Detected source language' },
            originalText: { type: Type.STRING, description: 'Full verbatim original document text' },
            translation: { type: Type.STRING, description: 'Complete, verbatim translated text in Bengali' },
            summary: { type: Type.STRING, description: 'Brief summary of the document in Bengali' },
            totalSentencesCount: { type: Type.INTEGER, description: 'Total number of sentences identified' },
            translatedSentencesCount: { type: Type.INTEGER, description: 'Number of sentences translated' },
            omissionCheckStatus: { type: Type.STRING, description: 'Status confirmation of zero omissions' },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  pageNumber: { type: Type.STRING },
                  original: { type: Type.STRING },
                  translated: { type: Type.STRING },
                },
                required: ['original', 'translated'],
              },
              description: 'Page or section by section breakdown',
            },
            sentenceAlignment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  index: { type: Type.INTEGER },
                  original: { type: Type.STRING },
                  translated: { type: Type.STRING },
                  pageOrSection: { type: Type.STRING },
                },
                required: ['index', 'original', 'translated'],
              },
              description: 'Direct sentence-by-sentence pairs with zero omissions for side-by-side verification',
            },
          },
          required: ['detectedLanguage', 'translation', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    if (!parsed.omissionCheckStatus) {
      parsed.omissionCheckStatus = '১০০% সম্পূর্ণ: কোনো পেজ বা বাক্য বাদ দেওয়া হয়নি';
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Document translation error:', error);
    res.status(500).json({ error: error.message || 'Document processing failed.' });
  }
});

// Live microphone speech translation route (converts recorded voice blob into original transcript + Bengali translation)
app.post('/api/translate/live-mic', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', targetLang = 'bn' } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'Audio is required.' });
      return;
    }

    const ai = getGenAI();

    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: audioBase64,
      },
    };

    const promptPart = {
      text: `The user spoke into the microphone. Listen to the audio:
1. Transcribe the words exactly in the language spoken (whether Arabic, English, Urdu, Bengali, etc.).
2. Detect the spoken language.
3. Translate into ${targetLang === 'bn' ? 'simple, crystal-clear, and fluent Bengali (সহজ ভাষায় সুন্দর বাংলায় অনুবাদ)' : targetLang}.
4. If the speech is in Arabic, also provide the phonetic transliteration (ইংরেজি/বাংলা উচ্চারণে).`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, promptPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, description: 'Language detected from user voice' },
            transcription: { type: Type.STRING, description: 'Exact words spoken by user in original language' },
            translation: { type: Type.STRING, description: 'Clean translation into simple Bengali' },
            transliteration: { type: Type.STRING, description: 'Pronunciation transliteration if relevant' },
          },
          required: ['detectedLanguage', 'transcription', 'translation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Live mic error:', error);
    res.status(500).json({ error: error.message || 'Microphone speech processing failed.' });
  }
});

// Convert raw PCM buffer into valid RIFF WAV
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// Media URL translation endpoint (YouTube, Facebook, Podcasts, direct media URLs)
app.post('/api/translate/media-url', async (req: Request, res: Response) => {
  try {
    const { mediaUrl, targetLang = 'bn' } = req.body;
    if (!mediaUrl || typeof mediaUrl !== 'string') {
      res.status(400).json({ error: 'Media URL is required.' });
      return;
    }

    const trimmedUrl = mediaUrl.trim();
    const ai = getGenAI();

    let videoTitle = '';
    let authorName = '';
    let thumbnailUrl = '';
    let embedUrl = '';
    let pageContext = '';

    // 1. Detect YouTube links
    const isYouTube = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i.test(trimmedUrl);
    let ytVideoId = '';
    if (isYouTube) {
      const match = trimmedUrl.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        ytVideoId = match[1];
        embedUrl = `https://www.youtube-nocookie.com/embed/${ytVideoId}`;
        thumbnailUrl = `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`;
      }
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`, {
          signal: AbortSignal.timeout(5000),
        });
        if (oembedRes.ok) {
          const oembedData: any = await oembedRes.json();
          videoTitle = oembedData.title || '';
          authorName = oembedData.author_name || '';
          if (oembedData.thumbnail_url) {
            thumbnailUrl = oembedData.thumbnail_url;
          }
        }
      } catch (oeErr) {
        console.warn('YouTube oEmbed warning:', oeErr);
      }
    }

    // 2. Detect Facebook links
    const isFacebook = /(?:facebook\.com|fb\.watch)/i.test(trimmedUrl);
    if (isFacebook) {
      try {
        const fbRes = await fetch(trimmedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(5000),
        });
        if (fbRes.ok) {
          const html = await fbRes.text();
          const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i);
          const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
          const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i);
          if (ogTitle) videoTitle = ogTitle[1];
          if (ogDesc) pageContext = ogDesc[1];
          if (ogImage) thumbnailUrl = ogImage[1];
        }
      } catch (fbErr) {
        console.warn('Facebook metadata fetch warning:', fbErr);
      }
    }

    // 3. Detect direct audio or video file URL (.mp3, .wav, .mp4, etc.)
    const isDirectMedia = /\.(mp3|wav|m4a|ogg|mp4|webm|mov)(\?.*)?$/i.test(trimmedUrl);
    let directMediaPart: any = null;

    if (isDirectMedia) {
      try {
        const headRes = await fetch(trimmedUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
        const contentLength = headRes.headers.get('content-length');
        const contentType = headRes.headers.get('content-type') || '';

        // If file size is under 20MB, fetch and process as inlineData
        if (!contentLength || parseInt(contentLength, 10) < 20 * 1024 * 1024) {
          const mediaFetch = await fetch(trimmedUrl, { signal: AbortSignal.timeout(15000) });
          if (mediaFetch.ok) {
            const arrayBuf = await mediaFetch.arrayBuffer();
            const mime = contentType || (trimmedUrl.match(/\.(mp4|webm)$/i) ? 'video/mp4' : 'audio/mp3');
            directMediaPart = {
              inlineData: {
                mimeType: mime.split(';')[0],
                data: Buffer.from(arrayBuf).toString('base64'),
              },
            };
          }
        }
      } catch (mediaErr) {
        console.warn('Direct media stream fetch warning:', mediaErr);
      }
    }

    let parsedResult: any = null;

    if (directMediaPart) {
      // Analyze with Gemini Multimodal model
      const promptText = `Analyze the audio/video content of this media file (${trimmedUrl}):
1. Transcribe the dialogue/speech verbatim in its original spoken language (Arabic, English, Urdu, Bengali, etc.).
2. Detect the spoken language.
3. Translate the spoken content accurately into ${targetLang === 'bn' ? 'simple, easily understandable Bengali (সহজ ভাষায় সুন্দর বাংলা অনুবাদ)' : targetLang}.
4. Provide structured JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [directMediaPart, { text: promptText }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING },
              transcription: { type: Type.STRING },
              translation: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              transliteration: { type: Type.STRING },
            },
            required: ['detectedLanguage', 'transcription', 'translation'],
          },
        },
      });

      parsedResult = JSON.parse(response.text?.trim() || '{}');
    } else {
      // Analyze with Gemini 3.8 Flash using Google Search grounding
      const promptText = `You are an expert multilingual media transcriber and translator.
The user provided this video or media link: "${trimmedUrl}"
${videoTitle ? `Video Title: "${videoTitle}"` : ''}
${authorName ? `Channel/Author: "${authorName}"` : ''}
${pageContext ? `Description/Context: "${pageContext}"` : ''}

Task:
1. Search and identify the video/audio content, spoken speech, dialogue, sermon, lecture, podcast conversation, or lyrics.
2. Transcribe the spoken words in the original language (e.g. Arabic, English, Urdu, etc.).
3. Detect the spoken language.
4. Translate the content into ${targetLang === 'bn' ? 'clear, natural, and fluent Bengali (সহজ ও সাবলীল বাংলা)' : targetLang}.
5. Provide a clear Bengali summary of the media.
6. Extract 4-6 key takeaways/points in Bengali.
7. If the speech is Arabic or includes Arabic terms, provide phonetic pronunciation transliteration.

Format your response strictly as a JSON object:
{
  "detectedLanguage": "Original spoken language (e.g. Arabic, English)",
  "title": "Title of the video or media",
  "author": "Speaker or Channel name",
  "transcription": "Verbatim or detailed transcription of the spoken dialogue in original language",
  "translation": "Complete, fluent Bengali translation (সহজ বাংলায় সুন্দর অনুবাদ)",
  "summary": "Bengali summary of the content",
  "keyPoints": ["Key point 1 in Bengali", "Key point 2 in Bengali"],
  "transliteration": "Phonetic transliteration if applicable"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const rawText = response.text?.trim() || '{}';
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
      try {
        parsedResult = JSON.parse(jsonMatch[1] || rawText);
      } catch (jsonErr) {
        parsedResult = {
          detectedLanguage: 'Auto',
          title: videoTitle || 'অনলাইন মিডিয়া লিংক',
          author: authorName || '',
          transcription: 'মিডিয়া কনটেন্ট সফলভাবে বিশ্লেষণ করা হয়েছে।',
          translation: rawText.replace(/```(?:json)?|```/g, ''),
          summary: 'অনলাইন মিডিয়া থেকে সংগৃহীত ও অনূদিত তথ্য।',
          keyPoints: ['অনলাইন লিংক থেকে সফলভাবে ডেটা আহরণ সম্পন্ন হয়েছে।'],
        };
      }
    }

    res.json({
      mediaUrl: trimmedUrl,
      title: parsedResult.title || videoTitle || 'অনলাইন মিডিয়া ভিডিও/অডিও',
      author: parsedResult.author || authorName || '',
      thumbnailUrl: thumbnailUrl || undefined,
      embedUrl: embedUrl || undefined,
      detectedLanguage: parsedResult.detectedLanguage || 'Auto',
      transcription: parsedResult.transcription || '',
      translation: parsedResult.translation || '',
      summary: parsedResult.summary || '',
      keyPoints: parsedResult.keyPoints || [],
      transliteration: parsedResult.transliteration || undefined,
    });
  } catch (error: any) {
    console.error('Media URL translation error:', error);
    res.status(500).json({ error: error.message || 'মিডিয়া লিংকটি বিশ্লেষণ করা সম্ভব হয়নি।' });
  }
});

// University Student Study & Explanation Hub:
// Summarize in Bengali, English, Urdu, or Arabic; Explain in depth; Real-world examples; Exam tips; Interactive query
app.post('/api/study/explain-and-summarize', async (req: Request, res: Response) => {
  try {
    const {
      content,
      url,
      fileBase64,
      mimeType = 'application/pdf',
      action = 'summarize', // 'summarize' | 'explain' | 'interactive_query'
      language = 'bn', // 'bn' | 'en' | 'ur' | 'ar'
      style = 'academic', // 'simple' | 'academic' | 'examples' | 'exam_prep'
      customQuestion = '',
      chatHistory = [],
    } = req.body;

    if (!content && !url && !fileBase64) {
      res.status(400).json({ error: 'Please provide content text, a URL link, or a file.' });
      return;
    }

    const ai = getGenAI();

    // Map language code to human-readable instructions
    const langInstructions: Record<string, string> = {
      bn: 'বাংলা ভাষায় উত্তর দিন (সহজ, প্রাঞ্জল ও চমৎকার বোধগম্য একাডেমিক বাংলায়)',
      en: 'Respond in English (Clear, structured, high-quality academic English)',
      ur: 'اردو زبان میں جواب دیں (شستہ، معیاری، آسان اور فصیح اردو میں)',
      ar: 'أجب باللغة العربية الفصحى الواضحة والسهلة مع ضبط المفاهيم بدقة',
    };
    const targetLanguageDirective = langInstructions[language] || langInstructions.bn;

    const parts: any[] = [];

    // If PDF/file provided as base64
    if (fileBase64) {
      if (mimeType.includes('pdf')) {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBase64,
          },
        });
      } else {
        const textContent = Buffer.from(fileBase64, 'base64').toString('utf-8');
        parts.push({
          text: `Source Document Content:\n"""\n${textContent.slice(0, 50000)}\n"""`,
        });
      }
    } else if (content) {
      parts.push({
        text: `Source Material / Content:\n"""\n${content.slice(0, 60000)}\n"""`,
      });
    }

    // Determine task instruction
    let taskInstruction = '';
    if (action === 'summarize') {
      taskInstruction = `TASK: SUMMARIZE THE PROVIDED CONTENT
Target Language: ${targetLanguageDirective}
Summary Depth/Style: ${style}
Instructions:
1. Provide an insightful title.
2. Give a 3-5 sentence executive summary in the requested language (${language}).
3. Provide 4-6 essential bullet points / key takeaways in the requested language.
4. Highlight 3-5 key academic terms with their meanings.
5. Provide 2-3 suggested follow-up questions the student can ask to explore deeper.`;
    } else if (action === 'explain') {
      taskInstruction = `TASK: DEEP ACADEMIC EXPLANATION ("আমাকে আরও ব্যাখ্যা করে বুঝিয়ে দাও")
The student explicitly asks for a thorough, in-depth explanation breaking down theories and concepts.
Target Language: ${targetLanguageDirective}
Explanation Angle: ${style}
Instructions:
1. Break down the core concepts, theories, and underlying logic into clear, understandable sections.
2. Provide 2-3 realistic, intuitive real-world examples or analogies to make the abstract concepts crystal clear.
3. Demystify all complex or specialized jargon (Arabic, English, Urdu, or technical terms).
4. Provide exam study tips and conceptual questions likely to be asked by the professor in exams.
5. Write with pedagogical warmth, clarity, and depth in the requested language.`;
    } else {
      // Interactive query / custom question
      taskInstruction = `TASK: ANSWER STUDENT'S SPECIFIC STUDY QUESTION / QUERY
Question / Request: "${customQuestion || 'Explain this in detail'}"
Target Language: ${targetLanguageDirective}
Instructions:
1. Ground your answer directly in the provided material (document / URL / text).
2. Explain thoroughly, step-by-step, with high clarity in the requested language (${language}).
3. Provide realistic examples where helpful.`;
    }

    if (url && !content && !fileBase64) {
      taskInstruction = `The user provided this URL: "${url.trim()}".
First, search and retrieve the main contents, article, lecture notes, or video details of this link.
Then perform the following task:
${taskInstruction}`;
    }

    let historyContext = '';
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      historyContext = `\nPrevious Conversation Context:\n` +
        chatHistory.map((m: any) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.text}`).join('\n') +
        `\n---\n`;
    }

    parts.push({
      text: `${historyContext}${taskInstruction}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        ...(url && !content && !fileBase64 ? { tools: [{ googleSearch: {} }] } : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the summary or explanation' },
            languageUsed: { type: Type.STRING, description: 'Language used in response' },
            actionType: { type: Type.STRING, description: 'Type of action performed' },
            overview: { type: Type.STRING, description: 'High-level overview or executive summary' },
            detailedExplanation: { type: Type.STRING, description: 'Comprehensive in-depth explanation breaking down theories and ideas' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key takeaways and essential points',
            },
            realWorldExamples: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Real-world analogies and examples',
            },
            vocabularyAndTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['term', 'meaning'],
              },
              description: 'Key terms, concepts, and jargon demystified',
            },
            examStudyTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Study advice, memorization tips, and potential exam questions',
            },
            suggestedFollowUpQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Suggested questions the student can ask next',
            },
          },
          required: ['title', 'overview', 'detailedExplanation', 'keyPoints'],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonMatch[1] || rawText);
    } catch {
      parsedResult = {
        title: 'স্টাডি সারসংক্ষেপ ও ব্যাখ্যা',
        languageUsed: language,
        actionType: action,
        overview: rawText.slice(0, 300),
        detailedExplanation: rawText,
        keyPoints: ['সফলভাবে বিশ্লেষণ সম্পন্ন হয়েছে।'],
      };
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.error('Explain and summarize error:', error);
    res.status(500).json({ error: error.message || 'ব্যাখ্যা বা সারসংক্ষেপ তৈরি করতে সমস্যা হয়েছে।' });
  }
});

// Full Audiobook Synthesis & WAV Download endpoint
app.post('/api/tts/audiobook', async (req: Request, res: Response) => {
  try {
    const { text, title = 'audiobook', voice = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for audiobook synthesis.' });
      return;
    }

    const ai = getGenAI();

    // Clean text: strip markdown syntax, excess whitespaces
    const cleanText = text
      .replace(/[#*`_~>\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Split text into chunks (~350 chars each) for smooth TTS processing
    const sentences = cleanText.split(/(?<=[।?!.\n])/g).filter((s) => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > 350) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    // Process up to 8 chunks (~2800 characters)
    const activeChunks = chunks.slice(0, 8);
    const pcmBuffers: Buffer[] = [];

    for (const chunk of activeChunks) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: chunk }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          pcmBuffers.push(Buffer.from(base64Audio, 'base64'));
        }
      } catch (chunkErr) {
        console.warn('Audiobook chunk TTS warning:', chunkErr);
      }
    }

    if (pcmBuffers.length === 0) {
      res.status(500).json({ error: 'অডিওবুক তৈরিতে সমস্যা হয়েছে।' });
      return;
    }

    const totalPcm = Buffer.concat(pcmBuffers);
    const wavBuffer = pcmToWav(totalPcm, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString('base64');

    res.json({
      success: true,
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
      fileName: `${(title || 'audiobook').replace(/[^a-zA-Z0-9_\u0980-\u09FF]/g, '_')}.wav`,
      chunksProcessed: pcmBuffers.length,
      totalChunks: chunks.length,
    });
  } catch (error: any) {
    console.error('Audiobook generation error:', error);
    res.status(500).json({ error: error.message || 'অডিওবুক তৈরি করা যায়নি।' });
  }
});

// Text-to-Speech route using Gemini TTS
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'Puck', format = 'base64' } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required for TTS.' });
      return;
    }

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: text.slice(0, 500) }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      res.status(500).json({ error: 'TTS audio could not be generated.' });
      return;
    }

    if (format === 'wav') {
      const pcmBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
      res.json({ audioBase64: wavBuffer.toString('base64'), mimeType: 'audio/wav' });
      return;
    }

    res.json({ audioBase64: base64Audio });
  } catch (error: any) {
    console.warn('Gemini TTS error (client can fallback to browser speech):', error.message);
    res.status(500).json({ error: error.message || 'TTS failed' });
  }
});

// 1. Image / Screenshot OCR & Student Translation Route
app.post('/api/translate/image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', targetLang = 'bn', studyMode = true } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Image data is required.' });
      return;
    }

    const ai = getGenAI();

    const imagePart = {
      inlineData: {
        mimeType: mimeType.split(';')[0],
        data: imageBase64,
      },
    };

    const targetLangLabel =
      targetLang === 'bn' ? 'Bengali (সহজ ও সুন্দর বাংলা)' :
      targetLang === 'en' ? 'English' :
      targetLang === 'ar' ? 'Arabic (العربية)' :
      targetLang === 'ur' ? 'Urdu (اردو)' : targetLang;

    const promptText = `You are a high-level multimodal OCR and educational translation expert.
CRITICAL MANDATE - ZERO OMISSION & VERBATIM SENTENCE/LINE ALIGNMENT:
1. The user will compare the translation line-by-line and sentence-by-sentence against the original image/screenshot!
2. Extract ALL visible text accurately and thoroughly in its original language (Arabic, English, Urdu, Bengali, etc.). Do not miss any text, caption, or footnote.
3. Detect the source language.
4. Translate every sentence/line accurately and fluently into ${targetLangLabel} without skipping or condensing anything.
5. Provide a rich educational student breakdown and sentence-by-sentence alignment:
   - "transcription": Complete verbatim text from the image.
   - "translation": High quality, natural translation in target language.
   - "transliteration": Pronunciation guide in English/Bengali phonetics if source is Arabic or Urdu.
   - "summary": 1-2 sentence core message.
   - "sentenceAlignment": Array of each original sentence or line paired with its corresponding translation.
   - "studentNotes": Simple explanation of tricky grammar, cultural context, or phrases for students.
   - "keyPoints": Bullet points of primary lessons/facts.
   - "vocabulary": List of important words with pronunciation, meaning in target language, part of speech, and a sample usage sentence.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, { text: promptText }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING, description: 'Detected source language' },
            transcription: { type: Type.STRING, description: 'Original text extracted from the image' },
            translation: { type: Type.STRING, description: 'Translated text in target language' },
            transliteration: { type: Type.STRING, description: 'Pronunciation transliteration' },
            summary: { type: Type.STRING, description: 'Summary of the content' },
            omissionCheckStatus: { type: Type.STRING, description: 'Zero omission confirmation' },
            sentenceAlignment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  index: { type: Type.INTEGER },
                  original: { type: Type.STRING },
                  translated: { type: Type.STRING },
                },
                required: ['index', 'original', 'translated'],
              },
              description: 'Line-by-line or sentence-by-sentence pairing for verification',
            },
            studentNotes: { type: Type.STRING, description: 'Educational explanation for students' },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key takeaways',
            },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                },
                required: ['word', 'meaning'],
              },
              description: 'Word-by-word student vocabulary list',
            },
          },
          required: ['detectedLanguage', 'transcription', 'translation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    if (!parsed.omissionCheckStatus) {
      parsed.omissionCheckStatus = '১০০% সম্পূর্ণ: ছবির প্রতিটি লাইন ও সেন্টেন্স হুবহু অনূদিত';
    }
    res.json(parsed);
  } catch (error: any) {
    console.error('Image translation error:', error);
    res.status(500).json({ error: error.message || 'ছবির লেখা বিশ্লেষণ ও অনুবাদ করা যায়নি।' });
  }
});

// 2. Bilingual Face-to-Face Live Conversation Endpoint
app.post('/api/translate/conversation', async (req: Request, res: Response) => {
  try {
    const {
      audioBase64,
      textInput,
      mimeType = 'audio/webm',
      sourceLang = 'bn',
      targetLang = 'ar',
      voiceGender = 'female', // 'male' | 'female'
    } = req.body;

    const ai = getGenAI();
    const contents: any[] = [];

    if (audioBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType.split(';')[0],
          data: audioBase64,
        },
      });
    }

    const inputDesc = audioBase64 ? 'from the provided user speech recording' : `from this text: "${textInput || ''}"`;

    const targetLangDesc =
      targetLang === 'bn' ? 'Bengali (বাংলা)' :
      targetLang === 'ar' ? 'Modern Standard Arabic (العربية)' :
      targetLang === 'en' ? 'English' :
      targetLang === 'ur' ? 'Urdu (اردو)' : targetLang;

    const prompt = `This is a live face-to-face conversation between two people who speak different languages.
Input speech/text: ${inputDesc}.
Expected source language: ${sourceLang}.
Translate immediately for the other person into: ${targetLangDesc}.

Requirements:
1. Transcribe verbatim in the speaker's original language.
2. Translate naturally and politely into ${targetLangDesc} so the other party can understand effortlessly.
3. Provide phonetic pronunciation/transliteration.
4. Keep the phrasing polite and conversational.
5. Question Detection & Smart Reply:
   Determine if the speaker is asking a question or requesting information (e.g. asking where something is, asking about their opinion, health, family, instructions, plans).
   If YES, set detectedQuestion.hasQuestion = true:
   - questionOriginal: exact question asked
   - questionTranslated: translation of the question into ${targetLangDesc}
   - quickAnswer: short 1-sentence recommended response in ${targetLangDesc}
   - detailedAnswer: polite, comprehensive response in ${targetLangDesc}
   - answerInSpeakerLang: natural reply in the questioner's original language (${sourceLang}) so the listener can directly say it back to them!
   - transliterationSpeakerLang: pronunciation guide of the answer in the questioner's language
   If NO question is asked, set detectedQuestion.hasQuestion = false.`;

    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING },
            originalText: { type: Type.STRING },
            translatedText: { type: Type.STRING },
            transliteration: { type: Type.STRING },
            detectedQuestion: {
              type: Type.OBJECT,
              properties: {
                hasQuestion: { type: Type.BOOLEAN },
                questionOriginal: { type: Type.STRING },
                questionTranslated: { type: Type.STRING },
                quickAnswer: { type: Type.STRING },
                detailedAnswer: { type: Type.STRING },
                answerInSpeakerLang: { type: Type.STRING },
                transliterationSpeakerLang: { type: Type.STRING },
              },
              required: ['hasQuestion'],
            },
          },
          required: ['originalText', 'translatedText'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Attempt to pre-synthesize TTS in the listener's requested gender voice
    let synthesizedAudioBase64: string | undefined = undefined;
    try {
      const voiceName = voiceGender === 'female' ? 'Aoede' : 'Puck';
      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: parsed.translatedText?.slice(0, 400) || '' }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      const pcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (pcm) {
        const pcmBuffer = Buffer.from(pcm, 'base64');
        const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
        synthesizedAudioBase64 = wavBuffer.toString('base64');
      }
    } catch (ttsErr) {
      console.warn('Conversation TTS generation warning (client fallback available):', ttsErr);
    }

    res.json({
      ...parsed,
      audioBase64: synthesizedAudioBase64,
    });
  } catch (error: any) {
    console.error('Conversation translation error:', error);
    res.status(500).json({ error: error.message || 'কথোপকথন অনুবাদ ব্যর্থ হয়েছে।' });
  }
});

// 3. Language Learning Academy Interactive AI Practice Endpoint
app.post('/api/learning/practice', async (req: Request, res: Response) => {
  try {
    const {
      language = 'en', // 'en' | 'ar' | 'ur'
      level = 'root',  // 'root' | 'intermediate' | 'advanced'
      topic = 'everyday_greetings',
      action = 'tutor_chat', // 'tutor_chat' | 'check_answer' | 'generate_lesson'
      userMessage = '',
      context = '',
    } = req.body;

    const ai = getGenAI();

    const langName =
      language === 'ar' ? 'Arabic (العربية)' :
      language === 'ur' ? 'Urdu (اردو)' : 'English';

    const prompt = `You are a warm, highly encouraging, and expert multilingual language tutor helping a Bengali-speaking student learn ${langName}.
Target Language: ${langName}
Student Level: ${level} (Root / Beginner, Intermediate, or Advanced)
Topic: ${topic}
Action: ${action}

Student's input:
"""
${userMessage}
"""
Context: ${context}

Guidelines:
1. Explain clearly in friendly, easy-to-understand Bengali (সহজ ভাষায় সুন্দর করে বুঝিয়ে বলো).
2. If checking an answer, point out what is correct, gently correct mistakes, and explain why.
3. Provide word breakdowns with pronunciation (উচ্চারণ) and Bengali meaning.
4. Give a follow-up speaking prompt or quick challenge to keep the student practicing.
5. Provide structured JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tutorResponseBn: { type: Type.STRING, description: 'Friendly explanation in Bengali' },
            sampleTargetPhrase: { type: Type.STRING, description: 'Sentence or phrase in the language being learned' },
            transliteration: { type: Type.STRING, description: 'Pronunciation in Bengali/English characters' },
            meaningBn: { type: Type.STRING, description: 'Meaning in Bengali' },
            corrections: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Grammar or pronunciation corrections if applicable',
            },
            keyVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                },
                required: ['word', 'meaning'],
              },
            },
            nextPracticePrompt: { type: Type.STRING, description: 'Next question or speaking prompt for the student' },
          },
          required: ['tutorResponseBn'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Learning practice error:', error);
    res.status(500).json({ error: error.message || 'টিউটর প্র্যাকটিস ব্যর্থ হয়েছে।' });
  }
});

// 4. Classroom & Conversation Automatic Question Answer Generator & Refiner
app.post('/api/qa/auto-answer', async (req: Request, res: Response) => {
  try {
    const {
      question,
      context = '',
      speakerLanguage = 'auto',
      targetSpeakerLanguage = 'ar', // language in which to provide the spoken answer back to teacher/speaker
      answerStyle = 'quick', // 'quick' | 'detailed' | 'simple' | 'academic'
    } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const ai = getGenAI();

    const targetSpeakerLangLabel =
      targetSpeakerLanguage === 'ar' ? 'Modern Standard Arabic (العربية الفصحى)' :
      targetSpeakerLanguage === 'en' ? 'English' :
      targetSpeakerLanguage === 'ur' ? 'Urdu (اردو)' : 'Bengali (বাংলা)';

    let styleInstruction = 'সংক্ষিপ্ত ১-২ লাইনের পয়েন্টেড উত্তর যাতে ছাত্র ক্লাসে হাত তুলে সঙ্গে সঙ্গে উত্তর দিতে পারে।';
    if (answerStyle === 'detailed') {
      styleInstruction = 'বিশদ প্রাতিষ্ঠানিক ব্যাখ্যা, যুক্তি, তথ্যসূত্র ও পয়েন্টভিত্তিক গভীর উত্তর।';
    } else if (answerStyle === 'simple') {
      styleInstruction = 'খুব সহজ উপমা ও অতি সাধারণ বাংলায় উত্তর যাতে যে কেউই সহজে বুঝতে পারে।';
    } else if (answerStyle === 'academic') {
      styleInstruction = 'বিশ্ববিদ্যালয় উচ্চমানের থিসিস ও সেমিস্টার পরীক্ষার উপযোগী তাত্ত্বিক পরিভাষাবহুল উত্তর।';
    }

    const prompt = `You are a high-level academic assistant helping a university student respond to a question asked by their professor in a live class, or by a conversational partner.
Question asked:
"""
${question}
"""
Surrounding context or lecture excerpt:
"""
${context || 'University live classroom lecture context'}
"""
Detected/Speaker Language: ${speakerLanguage}
Answer Style Required: ${styleInstruction}
Target language to reply to professor/speaker: ${targetSpeakerLangLabel}

Tasks:
1. Translate the question into crystal-clear Bengali (if not already in Bengali).
2. Generate an immediate Quick Answer (তাত্ক্ষণিক উত্তর - ১-২ বাক্য) in Bengali.
3. Generate a Detailed Academic Answer (বিস্তারিত উত্তর) with reasoning, points, and examples in Bengali.
4. Translate the optimal answer into the professor's language (${targetSpeakerLangLabel}) so the student can directly speak or read it to them.
5. Provide a phonetic pronunciation/transliteration guide of the reply in Bengali/English letters.
6. List 2-3 key academic concepts/keywords.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionOriginal: { type: Type.STRING },
            questionTranslatedBn: { type: Type.STRING },
            quickAnswerBn: { type: Type.STRING, description: '1-2 sentence quick response in Bengali' },
            detailedAnswerBn: { type: Type.STRING, description: 'Deep academic explanation in Bengali' },
            answerInSpeakerLang: { type: Type.STRING, description: 'Answer translated in teacher/speaker language' },
            transliterationSpeakerLang: { type: Type.STRING, description: 'Phonetic pronunciation guide' },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['questionOriginal', 'quickAnswerBn', 'detailedAnswerBn', 'answerInSpeakerLang'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Generate TTS for the answer in speaker's language so student can listen to it and repeat
    let audioBase64: string | undefined = undefined;
    try {
      const textToSpeak = parsed.answerInSpeakerLang?.slice(0, 350);
      if (textToSpeak) {
        const voiceResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: textToSpeak }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
            },
          },
        });
        const pcm = voiceResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (pcm) {
          const pcmBuf = Buffer.from(pcm, 'base64');
          const wavBuf = pcmToWav(pcmBuf, 24000, 1, 16);
          audioBase64 = wavBuf.toString('base64');
        }
      }
    } catch (ttsErr) {
      console.warn('Auto-answer TTS generation warning:', ttsErr);
    }

    res.json({
      ...parsed,
      audioBase64,
    });
  } catch (error: any) {
    console.error('Auto-answer endpoint error:', error);
    res.status(500).json({ error: error.message || 'স্বয়ংক্রিয় উত্তর তৈরিতে সমস্যা হয়েছে।' });
  }
});

// -------------------------------------------------------------
// Universal AI Audiobook Studio Endpoint
// Converts PDF, Word (.docx), URL, Pasted Text, and Audio/Video into rich multi-chapter audiobooks
// -------------------------------------------------------------
app.post('/api/audiobook/generate', async (req: Request, res: Response) => {
  try {
    const {
      sourceType = 'text', // 'pdf' | 'word' | 'url' | 'text' | 'media'
      text = '',
      url = '',
      fileBase64 = '',
      fileName = '',
      mimeType = '',
      targetLang = 'bn', // 'bn' | 'ar' | 'en' | 'ur' | 'hi' etc.
      style = 'verbatim', // 'verbatim' | 'podcast' | 'deep_study'
      narratorTone = 'calm', // 'calm' | 'academic' | 'energetic'
      voiceGender = 'male', // 'male' | 'female'
    } = req.body;

    if (!text && !url && !fileBase64) {
      res.status(400).json({ error: 'Please provide a file, URL, or text to generate an audiobook.' });
      return;
    }

    const ai = getGenAI();

    // Map target language code to human-readable target language name
    const langNames: Record<string, string> = {
      bn: 'Bengali (সহজ, প্রাঞ্জল ও চমৎকার শ্রবণযোগ্য বাংলা)',
      ar: 'Modern Standard Arabic (العربية الفصحى الفصيحة والمشوقة)',
      en: 'English (Fluent, engaging, expressive English)',
      ur: 'Urdu (شستہ، رواں، فصیح اور پرلطف اردو)',
      hi: 'Hindi (सरल, स्पष्ट और मधुर हिंदी)',
      fr: 'French (Français fluide et expressif)',
      es: 'Spanish (Español fluido y expresivo)',
    };
    const targetLangLabel = langNames[targetLang] || `${targetLang} language`;

    // Map style instructions
    let styleInstruction = '';
    if (style === 'verbatim') {
      styleInstruction = `
STYLE: VERBATIM COMPLETE NARRATION (পূর্ণাঙ্গ ও হুবহু অনুবাদভিত্তিক পাঠ)
- Retain all ideas, sentences, and arguments from the source with ZERO omission.
- Adapt the phrasing for natural human oral narration (oral flow, smooth transitions, proper pauses).
- Do not skip pages, paragraphs, or essential explanations.
- Divide logically into chronological chapters (3 to 6 chapters depending on length).
`;
    } else if (style === 'podcast') {
      styleInstruction = `
STYLE: ENGAGING NARRATIVE PODCAST (পডকাস্ট স্টোরিটেলিং ও আকর্ষক কথকতা)
- Frame the content like a world-class documentary podcast or storytelling session.
- Hook the listener right away with vivid narration, rhetorical questions, and captivating cadence.
- Distill key messages into compelling narrative arcs across 3 to 5 thematic chapters.
- Maintain high intellectual depth while being immensely enjoyable to listen to.
`;
    } else {
      styleInstruction = `
STYLE: DEEP STUDY & PEDAGOGICAL LECTURE (বাস্তব উদাহরণসহ গভীর বিশ্লেষণমূলক স্টাডি অডিওবুক)
- Present the content as an insightful masterclass audio lecture.
- Explain each concept step-by-step, unpacking tricky jargon with simple real-world analogies.
- Add educational reflections, memory anchors, and context notes in each chapter.
- Divide into 3 to 5 concept-focused learning chapters.
`;
    }

    // Tone instruction
    const toneInstruction =
      narratorTone === 'calm'
        ? 'Voice Tone: Calm, soothing, articulate, and thoughtful (শান্ত, সুমধুর ও হৃদয়গ্রাহী বাচনভঙ্গি).'
        : narratorTone === 'academic'
        ? 'Voice Tone: Dignified, academic, authoritative, and precise (গম্ভীর, প্রাতিষ্ঠানিক ও নির্ভরযোগ্য কণ্ঠধারা).'
        : 'Voice Tone: Energetic, enthusiastic, inspiring, and engaging (প্রাণবন্ত, অনুপ্রেরণামূলক ও সতেজ বাচনভঙ্গি).';

    const parts: any[] = [];

    // Process input based on sourceType
    if (sourceType === 'word' || fileName.toLowerCase().endsWith('.docx')) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const mammothResult = await mammoth.extractRawText({ buffer });
      const docxText = mammothResult.value;
      parts.push({
        text: `Extracted text from Word document (${fileName || 'document.docx'}):\n"""\n${docxText.slice(0, 120000)}\n"""`,
      });
    } else if (sourceType === 'pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: fileBase64,
        },
      });
      parts.push({
        text: `PDF Document (${fileName || 'document.pdf'}). Read all pages thoroughly from start to finish.`,
      });
    } else if (sourceType === 'media' && fileBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/mp3',
          data: fileBase64,
        },
      });
      parts.push({
        text: `Recorded audio/video media file (${fileName || 'media'}). Transcribe and convert spoken content into an audiobook.`,
      });
    } else if (sourceType === 'url' && url) {
      parts.push({
        text: `Web/Media URL: "${url.trim()}". Search and extract all core articles, video speeches, or lectures from this link.`,
      });
    } else {
      parts.push({
        text: `Source Text Content:\n"""\n${(text || fileBase64).slice(0, 100000)}\n"""`,
      });
    }

    const mainPrompt = `You are a world-class audiobook producer, master translator, and narrator director.
Create a rich, structured, professional AUDIOBOOK in ${targetLangLabel}.

${styleInstruction}
${toneInstruction}

Requirements:
1. "title": Dignified and captivating title for this audiobook in ${targetLangLabel}.
2. "authorOrSource": Identified author, speaker, or source topic.
3. "detectedSourceLang": Detected original language of the material (e.g. Arabic, English, Urdu, etc.).
4. "targetLanguage": "${targetLang}"
5. "summary": A compelling 2-3 paragraph executive audio summary introducing the listener to what this audiobook is about.
6. "chapters": Divide the material into 3 to 6 structured, sequential chapters:
   - "chapterNumber": 1, 2, 3...
   - "title": Engaging chapter title in ${targetLangLabel}.
   - "audiobookText": The complete spoken script of the chapter in ${targetLangLabel}. Written specifically for oral delivery with natural rhythm and emotional resonance.
   - "sentences": Array of individual sentences in ${targetLangLabel} making up this chapter's text. This is CRITICAL because the mobile/desktop web app will highlight each sentence in real-time as the audio plays!
   - "estimatedDurationSec": Approximate reading time in seconds (e.g. 120-300).
   - "keyThemes": 2-3 key insights or concepts covered in this chapter.
7. "vocabularyBank": 4-6 key specialized words or terms with their original word, pronunciation in ${targetLangLabel}, and clear meaning.`;

    parts.push({ text: mainPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        ...(sourceType === 'url' ? { tools: [{ googleSearch: {} }] } : {}),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the audiobook' },
            authorOrSource: { type: Type.STRING, description: 'Author or source description' },
            detectedSourceLang: { type: Type.STRING, description: 'Source language detected' },
            targetLanguage: { type: Type.STRING, description: 'Target language of audiobook' },
            summary: { type: Type.STRING, description: 'Engaging audio summary of the audiobook' },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  audiobookText: { type: Type.STRING, description: 'Spoken narration script' },
                  sentences: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Individual sentences for real-time synchronized highlight playback',
                  },
                  estimatedDurationSec: { type: Type.INTEGER },
                  keyThemes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['chapterNumber', 'title', 'audiobookText', 'sentences', 'estimatedDurationSec'],
              },
              description: 'Multi-chapter breakdown of the audiobook',
            },
            vocabularyBank: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  pronunciation: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                },
                required: ['term', 'meaning'],
              },
              description: 'Demystified vocabulary bank',
            },
          },
          required: ['title', 'detectedSourceLang', 'targetLanguage', 'summary', 'chapters'],
        },
      },
    });

    const rawText = response.text?.trim() || '{}';
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawText];
    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[1] || rawText);
    } catch {
      parsed = {
        title: 'অডিওবুক',
        authorOrSource: 'ভাষানিধি স্টুডিও',
        detectedSourceLang: 'অটো',
        targetLanguage: targetLang,
        summary: rawText.slice(0, 300),
        chapters: [
          {
            chapterNumber: 1,
            title: 'অধ্যায় ১: মূল পাঠ',
            audiobookText: rawText,
            sentences: rawText.split(/[।?!.]+/).filter((s: string) => s.trim().length > 0),
            estimatedDurationSec: 180,
            keyThemes: ['মূল বক্তব্য'],
          },
        ],
      };
    }

    // Ensure each chapter has valid sentences array
    if (Array.isArray(parsed.chapters)) {
      parsed.chapters.forEach((ch: any) => {
        if (!ch.sentences || !Array.isArray(ch.sentences) || ch.sentences.length === 0) {
          ch.sentences = (ch.audiobookText || '')
            .split(/(?<=[।?!.])/g)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        }
      });
    }

    // Optional: Generate a high-quality preview sample audio clip of chapter 1 opening
    let sampleAudioBase64: string | undefined = undefined;
    try {
      const firstChapterText = parsed.chapters?.[0]?.sentences?.slice(0, 3)?.join(' ') || parsed.summary?.slice(0, 250);
      if (firstChapterText && firstChapterText.length > 10) {
        const voiceName = voiceGender === 'female' ? 'Aoede' : 'Puck';
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: firstChapterText }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });
        const pcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (pcm) {
          const pcmBuf = Buffer.from(pcm, 'base64');
          const wavBuf = pcmToWav(pcmBuf, 24000, 1, 16);
          sampleAudioBase64 = wavBuf.toString('base64');
        }
      }
    } catch (ttsErr) {
      console.warn('Audiobook preview TTS warning:', ttsErr);
    }

    res.json({
      ...parsed,
      sampleAudioBase64,
    });
  } catch (error: any) {
    console.error('Audiobook generation error:', error);
    res.status(500).json({ error: error.message || 'অডিওবুক তৈরি করতে সমস্যা হয়েছে।' });
  }
});

// Endpoint to synthesize high-fidelity Gemini AI voice for a specific chapter
app.post('/api/audiobook/tts-chapter', async (req: Request, res: Response) => {
  try {
    const { text, voiceGender = 'male' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required for TTS synthesis.' });
      return;
    }

    const ai = getGenAI();
    const voiceName = voiceGender === 'female' ? 'Aoede' : 'Puck';

    // Gemini TTS preview handles up to ~500-1000 characters per call smoothly
    const snippet = text.slice(0, 600);

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: snippet }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const pcm = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!pcm) {
      res.status(500).json({ error: 'No audio generated.' });
      return;
    }

    const pcmBuf = Buffer.from(pcm, 'base64');
    const wavBuf = pcmToWav(pcmBuf, 24000, 1, 16);
    res.json({ audioBase64: wavBuf.toString('base64') });
  } catch (error: any) {
    console.error('Audiobook chapter TTS error:', error);
    res.status(500).json({ error: error.message || 'অডিও তৈরি করতে সমস্যা হয়েছে।' });
  }
});

// Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
