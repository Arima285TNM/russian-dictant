
import React, { useState, useEffect } from 'react';
import { getAllLessons } from '../services/geminiService';
import { getProgress, DetailedProgress } from '../utils/progress';

interface LessonSelectionProps {
  onSelectLesson: (id: string) => void;
  view: 'CATEGORIES' | 'CONVERSATIONS' | 'BOOKS';
  onViewChange: (view: 'CATEGORIES' | 'CONVERSATIONS' | 'BOOKS') => void;
  isDarkMode: boolean;
}

const LessonSelection: React.FC<LessonSelectionProps> = ({ onSelectLesson, view, onViewChange, isDarkMode }) => {
  const [lessons, setLessons] = useState<{id: string, title: string, description: string}[]>([]);
  const [progress, setProgress] = useState<DetailedProgress>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const gitCategory = view === 'CONVERSATIONS' ? 'dialogue' : 'passage';
        const [lessonList, prog] = await Promise.all([
          getAllLessons(gitCategory),
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
    if (view !== 'CATEGORIES') {
      loadData();
    }
  }, [view]);

  const renderCategories = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hội thoại */}
      <div 
        onClick={() => onViewChange('CONVERSATIONS')}
        className={`group relative h-64 border rounded-[2.5rem] p-8 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-xl ${isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-400'}`}
      >
        <div className={`absolute top-0 right-0 p-8 transition-colors ${isDarkMode ? 'text-indigo-500/10 group-hover:text-indigo-500/20' : 'text-indigo-600/5 group-hover:text-indigo-600/10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 border border-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <h3 className={`text-3xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hội thoại</h3>
          <p className="text-slate-500 mt-2 font-medium">Luyện nghe qua các tình huống giao tiếp thực tế.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
          <span>Khám phá ngay</span>
          <span>→</span>
        </div>
      </div>

      {/* Sách - Giờ đã là màu Indigo */}
      <div 
        onClick={() => onViewChange('BOOKS')}
        className={`group relative h-64 border rounded-[2.5rem] p-8 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-xl ${isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-400'}`}
      >
        <div className={`absolute top-0 right-0 p-8 transition-colors ${isDarkMode ? 'text-indigo-500/10 group-hover:text-indigo-500/20' : 'text-indigo-600/5 group-hover:text-indigo-600/10'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v11.494m-9-8.494h18" />
          </svg>
        </div>
        <div>
          <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 border border-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-8.494h18" />
            </svg>
          </div>
          <h3 className={`text-3xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sách & Văn bản</h3>
          <p className="text-slate-500 mt-2 font-medium">Luyện đọc hiểu qua các trích đoạn văn học chọn lọc.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
          <span>Khám phá ngay</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );

  const renderLessonList = () => {
    if (loading) {
      return (
        <div className="h-64 w-full flex flex-col items-center justify-center text-slate-500">
          <div className={`w-8 h-8 border-4 border-t-indigo-600 rounded-full animate-spin mb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} />
          <p className="text-xs font-bold uppercase tracking-widest">Đang tải danh sách...</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
        {lessons.map((lesson) => {
          const lessonData = progress[lesson.id];
          const lessonProgress = lessonData?.percentage || 0;
          const isCompleted = lessonData?.isCompleted || false;

          return (
            <div 
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`group relative border rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col h-56 hover:scale-[1.02] active:scale-[0.98] shadow-lg ${isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900' : 'bg-white border-slate-200 hover:border-indigo-400 shadow-slate-200/50'}`}
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${isCompleted ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'}`}>
                    {lesson.id.split('/').pop()}
                  </div>
                  {isCompleted && (
                    <span className="w-6 h-6 bg-indigo-600/20 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <h4 className={`font-bold text-lg group-hover:text-indigo-600 transition-colors line-clamp-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{lesson.title}</h4>
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                  {lesson.description}
                </p>
              </div>
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-slate-800/50' : 'border-slate-100'}`}>
                {lessonProgress > 0 ? (
                  <div className="space-y-2">
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                        <span className={isCompleted ? 'text-indigo-600' : (isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>Tiến độ</span>
                        <span className={isCompleted ? 'text-indigo-600' : (isDarkMode ? 'text-indigo-400' : 'text-indigo-600')}>{lessonProgress}%</span>
                     </div>
                     <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div className={`h-full transition-all duration-700 ${isDarkMode ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)]'}`} style={{ width: `${lessonProgress}%` }} />
                     </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
                    <span>Học ngay</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`h-full w-full overflow-y-auto p-6 md:p-10 scrollbar-hide transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className={`text-5xl font-black mb-2 tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Thư viện</h2>
            <div className="flex items-center gap-3 text-slate-500">
               <span className="w-12 h-1 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"></span>
               {view !== 'CATEGORIES' && (
                 <div className="flex items-center gap-2">
                   <button onClick={() => onViewChange('CATEGORIES')} className="text-xs font-black uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors">Trang chủ</button>
                   <span className="text-slate-700 font-bold">/</span>
                   <span className={`text-xs font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                     {view === 'CONVERSATIONS' ? 'Hội thoại' : 'Sách'}
                   </span>
                 </div>
               )}
            </div>
          </div>
          {view !== 'CATEGORIES' && (
            <button 
              onClick={() => onViewChange('CATEGORIES')}
              className={`px-6 py-3 rounded-2xl border transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-lg ${isDarkMode ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border-white/5' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7 7-7" />
              </svg>
              Quay lại
            </button>
          )}
        </header>
        {view === 'CATEGORIES' ? renderCategories() : renderLessonList()}
      </div>
    </div>
  );
};

export default LessonSelection;
