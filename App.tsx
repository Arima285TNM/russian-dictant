
import React, { useState, useCallback, useEffect } from 'react';
import { AppView } from './types';
import DictationRoom from './components/DictationRoom';
import ReadingRoom from './components/ReadingRoom';
import VideoDictation from './components/VideoDictation';
import VocabularyRoom from './components/VocabularyRoom';
import Sidebar from './components/Sidebar';
import LessonSelection from './components/LessonSelection';
import { fetchLessonText } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectionSubView, setSelectionSubView] = useState<'CATEGORIES' | 'CONVERSATIONS' | 'BOOKS'>('CATEGORIES');
  const [showNotice, setShowNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setShowNotice(true);
  }, []);

  const handleSelectLesson = async (id: string) => {
    setIsLoading(true);
    const lesson = await fetchLessonText(id);
    setIsLoading(false);
    
    if (lesson) {
        setSelectedLessonId(id);
        if (lesson.type === 'READING') {
            setCurrentView(AppView.READING);
        } else {
            setCurrentView(AppView.DICTATION);
        }
    }
  }

  const navigateTo = useCallback((view: AppView, lessonId: string | null = null) => {
    setCurrentView(view);
    setSelectedLessonId(lessonId);
  }, []);

  const handleBackToMenu = () => {
    setCurrentView(AppView.DASHBOARD);
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar currentView={currentView} onNavigate={navigateTo} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main className="flex-1 overflow-hidden relative">
        {isLoading && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm ${isDarkMode ? 'bg-slate-950/60' : 'bg-white/60'}`}>
                <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${isDarkMode ? 'border-slate-800 border-t-indigo-500' : 'border-slate-200 border-t-indigo-600'}`} />
                <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Đang tải...</p>
            </div>
        )}

        {currentView === AppView.DASHBOARD && (
          <LessonSelection 
            onSelectLesson={handleSelectLesson} 
            view={selectionSubView}
            onViewChange={setSelectionSubView}
            isDarkMode={isDarkMode}
          />
        )}
        {currentView === AppView.DICTATION && (
          <DictationRoom lessonId={selectedLessonId} onBack={handleBackToMenu} isDarkMode={isDarkMode} />
        )}
        {currentView === AppView.READING && (
          <ReadingRoom lessonId={selectedLessonId} onBack={handleBackToMenu} isDarkMode={isDarkMode} />
        )}
        {currentView === AppView.VIDEO_DICTATION && <VideoDictation isDarkMode={isDarkMode} />}
        {currentView === AppView.VOCABULARY && <VocabularyRoom isDarkMode={isDarkMode} />}
      </main>

      {showNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`${isDarkMode ? 'bg-slate-900 border-indigo-500/30' : 'bg-white border-slate-200'} border p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl animate-in zoom-in duration-500 flex flex-col items-center text-center`}>
            <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-8 border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-8.494h18" />
              </svg>
            </div>
            <h3 className={`text-2xl font-black mb-6 uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Web này của TNM đang trong quá trình phát triển!</h3>
            <div className={`w-full space-y-3 mb-10 text-sm p-6 rounded-3xl border ${isDarkMode ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
               <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] mb-4 border-b border-indigo-500/10 pb-2">Trong quá trình sử dụng không thể tránh khỏi những bất tiện, kính mong mọi người thông cảm!. Mọi thắc mắc và góp ý xin liên hệ:</p>
               <div className="space-y-2 text-left px-2">
                 <p className={`font-mono flex items-center gap-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                   <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                   Zalo: 0375043932
                 </p>
                 <p className={`font-mono flex items-center gap-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                   <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                   SĐT: +79069545668
                 </p>
               </div>
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/30"
            >
              Vào bài học
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
