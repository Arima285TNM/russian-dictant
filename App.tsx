
import React, { useState, useCallback } from 'react';
import { AppView } from './types';
import DictationRoom from './components/DictationRoom';
import VideoDictation from './components/VideoDictation';
import VocabularyRoom from './components/VocabularyRoom';
import Sidebar from './components/Sidebar';
import LessonSelection from './components/LessonSelection';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const navigateTo = useCallback((view: AppView, lessonId: string | null = null) => {
    setCurrentView(view);
    setSelectedLessonId(lessonId);
    // Nếu chuyển sang views khác ngoài Dashboard thì vẫn giữ activeCategoryId
  }, []);
  
  const handleSelectLesson = (id: string) => {
    navigateTo(AppView.DICTATION, id);
  }

  const handleBackToMenu = () => {
    navigateTo(AppView.DASHBOARD);
    // Khi nhấn thoát, view về DASHBOARD nhưng activeCategoryId vẫn được giữ
  }

  const handleCategoryChange = (catId: string | null) => {
    setActiveCategoryId(catId);
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar currentView={currentView} onNavigate={navigateTo} />
      <main className="flex-1 overflow-hidden">
        {currentView === AppView.DASHBOARD && (
          <LessonSelection 
            onSelectLesson={handleSelectLesson} 
            initialCategoryId={activeCategoryId}
            onCategoryChange={handleCategoryChange}
          />
        )}
        {currentView === AppView.DICTATION && (
          <DictationRoom lessonId={selectedLessonId} onBack={handleBackToMenu} />
        )}
        {currentView === AppView.VIDEO_DICTATION && <VideoDictation />}
        {currentView === AppView.VOCABULARY && <VocabularyRoom />}
      </main>
    </div>
  );
};

export default App;
