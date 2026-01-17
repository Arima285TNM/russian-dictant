
import React, { useState, useCallback, useEffect } from 'react';
import { AppView } from './types';
import DictationRoom from './components/DictationRoom';
import VideoDictation from './components/VideoDictation';
import VocabularyRoom from './components/VocabularyRoom';
import Sidebar from './components/Sidebar';
import LessonSelection from './components/LessonSelection';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    // Hiển thị thông báo khi vào trang web
    setShowNotice(true);
  }, []);

  const navigateTo = useCallback((view: AppView, lessonId: string | null = null) => {
    setCurrentView(view);
    setSelectedLessonId(lessonId);
  }, []);
  
  const handleSelectLesson = (id: string) => {
    navigateTo(AppView.DICTATION, id);
  }

  const handleBackToMenu = () => {
    navigateTo(AppView.DASHBOARD);
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <Sidebar currentView={currentView} onNavigate={navigateTo} />
      <main className="flex-1 overflow-hidden relative">
        {currentView === AppView.DASHBOARD && (
          <LessonSelection onSelectLesson={handleSelectLesson} />
        )}
        {currentView === AppView.DICTATION && (
          <DictationRoom lessonId={selectedLessonId} onBack={handleBackToMenu} />
        )}
        {currentView === AppView.VIDEO_DICTATION && <VideoDictation />}
        {currentView === AppView.VOCABULARY && <VocabularyRoom />}
      </main>

      {/* Welcome Notice Modal */}
      {showNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[2rem] max-w-md w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] animate-in zoom-in duration-500 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight">Thông báo</h3>
            
            <p className="text-slate-300 leading-relaxed mb-6 font-medium">
              Đây là đứa con tinh thần được tạo ra trong thời gian rảnh rỗi của <span className="text-indigo-400 font-bold">Trần Ngọc Minh</span>.
            </p>
            
            <div className="w-full space-y-3 mb-8 text-sm bg-black/40 p-5 rounded-2xl border border-white/5">
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Liên hệ</p>
               <div className="space-y-1">
                 <p className="text-slate-200 font-mono">Zalo: 0375043932</p>
                 <p className="text-slate-200 font-mono">+79069545668</p>
               </div>
            </div>
            
            <button
              onClick={() => setShowNotice(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-indigo-600/20"
            >
              Bắt đầu học ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
