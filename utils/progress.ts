
import { ProgressData } from '../types';

const PROGRESS_KEY = 'russianDictationProgress_v2';

export interface LessonProgress {
  currentIndex: number;
  isCompleted: boolean;
  percentage: number;
}

export interface DetailedProgress {
  [lessonId: string]: LessonProgress;
}

export const getProgress = (): DetailedProgress => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse progress data", error);
    return {};
  }
};

export const saveLessonProgress = (lessonId: string, index: number, total: number): void => {
  const allProgress = getProgress();
  const percentage = Math.round(((index + 1) / total) * 100);
  const isCompleted = index >= total - 1;

  allProgress[lessonId] = {
    currentIndex: index,
    isCompleted: isCompleted || (allProgress[lessonId]?.isCompleted ?? false),
    percentage: Math.max(percentage, allProgress[lessonId]?.percentage ?? 0)
  };

  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error("Failed to save progress", error);
  }
};

export const markLessonCompleted = (lessonId: string): void => {
    const allProgress = getProgress();
    if (allProgress[lessonId]) {
        allProgress[lessonId].isCompleted = true;
        allProgress[lessonId].percentage = 100;
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
    }
};
