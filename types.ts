
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  DICTATION = 'DICTATION',
  VIDEO_DICTATION = 'VIDEO_DICTATION',
  VOCABULARY = 'VOCABULARY'
}

export interface DialogLine {
  speaker: string;
  text: string;
  audioData?: string; // To store pre-generated base64 audio
}

export interface Lesson {
  id: string;
  lines: DialogLine[];
}

export interface LessonCategory {
  id: string;
  title: string;
  lessons: {
    id: string;
    title: string;
    description: string;
    disabled?: boolean;
  }[];
}

export interface Flashcard {
  id: string;
  word: string;
  translation: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'B2+';
}

export interface ProgressData {
    [lessonId: string]: number;
}
