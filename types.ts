
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  DICTATION = 'DICTATION',
  READING = 'READING',
  VIDEO_DICTATION = 'VIDEO_DICTATION',
  VOCABULARY = 'VOCABULARY'
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface QuizSet {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
}

export interface DialogLine {
  speaker: string;
  text: string;
  audioData?: string; 
  wordMeanings?: Record<string, string>;
}

export interface Lesson {
  id: string;
  type: 'DICTATION' | 'READING';
  lines?: DialogLine[]; // Cho Dictation
  fullText?: string;    // Cho Reading
  quizzes?: QuizSet[];  // Cho Reading (nhiều bộ câu hỏi)
  wordMeanings?: Record<string, string>;
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
