
import React, { useState, useEffect } from 'react';
import { getLessonCategories } from '../services/geminiService';
import { LessonCategory } from '../types';
import { getProgress, DetailedProgress } from '../utils/progress';

interface LessonSelectionProps {
  onSelectLesson: (id: string) => void;
  initialCategoryId?: string | null;
  onCategoryChange?: (id: string | null) => void;
}

const LessonSelection: React.FC<LessonSelectionProps> = ({ 
  onSelectLesson, 
  initialCategoryId = null,
  onCategoryChange 
}) => {
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [progress, setProgress] = useState<DetailedProgress>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategoryId);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [cats, prog] = await Promise.all([
        getLessonCategories(),
        getProgress()
      ]);
      setCategories(cats);
      setProgress(prog as any);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSetCategory = (id: string | null) => {
    setSelectedCategoryId(id);
    if (onCategoryChange) onCategoryChange(id);
  };

  const calculateCategoryProgress = (category: LessonCategory) => {
      const totalLessons = category.lessons.filter(l => !l.disabled).length;
      if (totalLessons === 0) return { completed: 0, total: 0, percentage: 0 };

      const completedLessons = category.lessons.reduce((count, lesson) => {
          if (progress[lesson.id]?.isCompleted) {
              return count + 1;
          }
          return count;
      }, 0);
      
      return {
          completed: completedLessons,
          total: totalLessons,
          percentage: Math.round((completedLessons / totalLessons) * 100),
      };
  };

  const renderLessonCard = (lesson: LessonCategory['lessons'][0]) => {
    const lessonData = progress[lesson.id];
    const lessonProgress = lessonData?.percentage || 0;
    const isCompleted = lessonData?.isCompleted || false;

    return (
      <div 
        key={lesson.id}
        onClick={() => !lesson.disabled && onSelectLesson(lesson.id)}
        className={`p-6 rounded-xl border bg-gray-800/50 border-gray-700 transition-all group flex flex-col ${
          lesson.disabled 
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:border-indigo-500 hover:bg-gray-800 cursor-pointer'
        }`}
      >
        <div className="flex-grow">
          <h4 className="font-bold text-white text-lg mb-2 line-clamp-1">{lesson.title}</h4>
          <p className="text-sm text-gray-400 line-clamp-2 mb-4 h-10">{lesson.description}</p>
        </div>
        
        <div className="mt-auto">
          {lessonProgress > 0 && !lesson.disabled && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                {isCompleted ? (
                  <div className="flex items-center gap-2">
                     <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                     <span className="text-xs font-bold text-green-400">Đã hoàn thành</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-indigo-400">{lessonProgress}% Hoàn thành</span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${lessonProgress}%` }}></div>
              </div>
            </div>
          )}

          <div className="flex justify-end items-center h-5">
            {!lesson.disabled && !isCompleted && (
              <span className="text-sm font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {lessonProgress > 0 ? 'Tiếp tục →' : 'Bắt đầu →'}
              </span>
            )}
            {lesson.disabled && (
              <span className="text-xs font-semibold text-gray-500">
                SẮP RA MẮT
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const renderCategorySelection = () => (
    <div className="p-10 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold mb-2 text-white">Luyện nghe hội thoại</h2>
        <p className="text-gray-400 mb-8">Học qua các tình huống thực tế bằng tiếng Nga.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {categories.map((category) => {
                const categoryProgress = calculateCategoryProgress(category);
                return (
                    <div
                        key={category.id}
                        onClick={() => handleSetCategory(category.id)}
                        className="p-8 rounded-2xl border bg-gray-800/50 border-gray-700 transition-all group hover:border-indigo-500 hover:bg-gray-800 cursor-pointer flex flex-col justify-between min-h-[220px]"
                    >
                        <div>
                            <h3 className="text-3xl font-bold text-indigo-400 mb-4">{category.title}</h3>
                            <p className="text-gray-400 mb-6">
                                Gồm {categoryProgress.total} bài luyện tập từ cơ bản đến nâng cao.
                            </p>
                        </div>
                        <div className="mt-auto">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-semibold text-white">Tổng tiến độ</span>
                                <span className="text-sm font-bold text-indigo-400">{categoryProgress.completed} / {categoryProgress.total} BÀI</span>
                             </div>
                             <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${categoryProgress.percentage}%` }}></div>
                             </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );

  const renderLessonGrid = () => {
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    if (!selectedCategory) return null;

    return (
      <div className="p-10 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => handleSetCategory(null)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Quay lại danh mục
          </button>
          <h3 className="text-3xl font-extrabold mb-2 text-white">{selectedCategory.title}</h3>
          <p className="text-gray-400 mb-8">Chọn bài học để bắt đầu luyện tập chính tả.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {selectedCategory.lessons.map(renderLessonCard)}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-10 h-full flex items-center justify-center text-gray-400">
        <div className="w-6 h-6 border-4 border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="h-full">
        {selectedCategoryId ? renderLessonGrid() : renderCategorySelection()}
    </div>
  );
};

export default LessonSelection;
