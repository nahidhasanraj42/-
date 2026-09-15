declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
  export function convertToHtml(options: { buffer: Buffer }): Promise<MammothResult>;
}

interface Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}
