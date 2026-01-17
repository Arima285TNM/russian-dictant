
import React, { useState, useEffect } from 'react';
import { getAllLessons } from '../services/geminiService';
import { getProgress, DetailedProgress } from '../utils/progress';

interface LessonSelectionProps {
  onSelectLesson: (id: string) => void;
}

const LessonSelection: React.FC<LessonSelectionProps> = ({ onSelectLesson }) => {
  const [lessons, setLessons] = useState<{id: string, title: string, description: string}[]>([]);
  const [progress, setProgress] = useState<DetailedProgress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [lessonList, prog] = await Promise.all([
          getAllLessons(),
          getProgress()
        ]);
        setLessons(lessonList);
        setProgress(prog);
      } catch (e) {
        console.error("Error loading selection data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">Đang tìm bài học mới nhất...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight uppercase">Luyện nghe hội thoại</h2>
          {/* Đã xóa dòng hướng dẫn theo yêu cầu */}
        </header>

        {lessons.length === 0 ? (
          <div className="p-20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
             <div className="text-slate-700 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v11.494m-9-8.494h18" />
                </svg>
             </div>
             <p className="text-slate-500 font-bold">Không tìm thấy bài học nào trong kho lưu trữ.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lessons.map((lesson) => {
              const lessonData = progress[lesson.id];
              const lessonProgress = lessonData?.percentage || 0;
              const isCompleted = lessonData?.isCompleted || false;

              return (
                <div 
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson.id)}
                  className="group relative bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 rounded-2xl p-6 transition-[border-color,background-color,transform] duration-300 cursor-pointer flex flex-col h-48 hover:scale-[1.02] active:scale-[0.98] transform-gpu"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1"></div>
                      {isCompleted && (
                        <span className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors line-clamp-1">{lesson.title}</h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800/50">
                    {lessonProgress > 0 ? (
                      <div className="flex items-center justify-between">
                         <div className="flex-1 h-1 bg-slate-800 rounded-full mr-3 overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${lessonProgress}%` }} />
                         </div>
                         <span className={`text-[10px] font-black ${isCompleted ? 'text-emerald-500' : 'text-indigo-400'}`}>{lessonProgress}%</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">
                        <span>Bắt đầu bài học</span>
                        <span>→</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonSelection;
