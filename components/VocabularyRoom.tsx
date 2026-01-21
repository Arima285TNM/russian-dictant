
import React, { useState } from 'react';
import { Flashcard } from '../types';

const allCards: Flashcard[] = [
  { id: '1', word: 'Мама', translation: 'Mẹ', level: 'A1' },
  { id: '2', word: 'Папа', translation: 'Bố', level: 'A1' },
  { id: '3', word: 'Книга', translation: 'Quyển sách', level: 'A1' },
  { id: '4', word: 'Город', translation: 'Thành phố', level: 'A1' },
  { id: '5', word: 'Университет', translation: 'Trường đại học', level: 'A2' },
  { id: '6', word: 'Работа', translation: 'Công việc', level: 'A2' },
  { id: '7', word: 'Правительство', translation: 'Chính phủ', level: 'B1' },
  { id: '8', word: 'Экономика', translation: 'Kinh tế', level: 'B1' },
  { id: '9', word: 'Искусство', translation: 'Nghệ thuật', level: 'B2' },
  { id: '10', word: 'Наука', translation: 'Khoa học', level: 'B2' },
  { id: '11', word: 'Философия', translation: 'Triết học', level: 'B2+' },
  { id: '12', word: 'Сознание', translation: 'Ý thức', level: 'B2+' },
];

interface VocabularyRoomProps {
  isDarkMode: boolean;
}

const VocabularyRoom: React.FC<VocabularyRoomProps> = ({ isDarkMode }) => {
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'B2+'>('A1');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleLevelChange = (newLevel: typeof level) => {
    setLevel(newLevel);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const cards = allCards.filter(c => c.level === level);
  const currentCard = cards[currentIndex];

  return (
    <div className={`h-full flex flex-col items-center justify-center p-8 transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="w-full max-w-4xl flex flex-col items-center h-full">
        <div className="mb-12">
            <div className={`flex gap-2 p-1 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                {(['A1', 'A2', 'B1', 'B2', 'B2+'] as const).map(l => (
                <button
                    key={l}
                    onClick={() => handleLevelChange(l)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${level === l ? 'bg-indigo-600 text-white shadow-lg' : (isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-indigo-600')}`}
                >
                    {l}
                </button>
                ))}
            </div>
        </div>

        {cards.length > 0 && currentCard ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full">
            <div 
              className="w-full max-w-md aspect-[5/3] cursor-pointer perspective-1000 group"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`relative w-full h-full transition-all duration-700 preserve-3d shadow-2xl rounded-[2.5rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className={`absolute inset-0 border backface-hidden rounded-[2.5rem] flex flex-col items-center justify-center p-10 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                  <h3 className={`text-5xl font-black text-center tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{currentCard.word}</h3>
                  <div className="mt-8 flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-600/40"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-600/20"></div>
                  </div>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-indigo-600 text-white rotate-y-180 backface-hidden rounded-[2.5rem] flex flex-col items-center justify-center p-10 shadow-inner">
                  <h3 className="text-4xl font-black text-center uppercase tracking-tight">{currentCard.translation}</h3>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <button 
                disabled={currentIndex === 0}
                onClick={() => { setCurrentIndex(p => p - 1); setIsFlipped(false); }}
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all disabled:opacity-30 ${isDarkMode ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="font-black text-slate-500 text-xs uppercase tracking-[0.3em] w-24 text-center">{currentIndex + 1} / {cards.length}</span>
              <button 
                disabled={currentIndex === cards.length - 1}
                onClick={() => { setCurrentIndex(p => p + 1); setIsFlipped(false); }}
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all disabled:opacity-30 ${isDarkMode ? 'bg-slate-900 border-white/5 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Danh sách trống.</p>
          </div>
        )}
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default VocabularyRoom;
