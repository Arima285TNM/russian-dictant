
import { ProgressData } from '../types';

const PROGRESS_KEY = 'russianDictationProgress';

export const getProgress = (): ProgressData => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse progress data from localStorage", error);
    return {};
  }
};

export const saveProgress = (lessonId: string, progress: number): void => {
  const allProgress = getProgress();
  allProgress[lessonId] = progress;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error("Failed to save progress data to localStorage", error);
  }
};
