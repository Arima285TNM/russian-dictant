
import React, { useState } from 'react';
import { AppView } from '../types';
import { translateText } from '../services/geminiService';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6 flex items-center justify-center shrink-0">{children}</div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isRuToVi, setIsRuToVi] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    try {
      const result = await translateText(sourceText, isRuToVi);
      setTranslatedText(result);
    } catch (e) {
      setTranslatedText("Lỗi dịch.");
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setIsRuToVi(!isRuToVi);
    setSourceText(translatedText);
    setTranslatedText("");
  };

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Bài học', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg> },
    { id: AppView.VIDEO_DICTATION, label: 'Video', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { id: AppView.VOCABULARY, label: 'Từ vựng', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-8.494h18" /></svg> },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-gray-950 border-r border-white/5 transition-all duration-300 flex flex-col relative z-[60] shadow-2xl shrink-0 h-full`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-all z-[70] border border-white/10"
        title={isCollapsed ? "Mở rộng" : "Thu gọn"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={`p-6 flex items-center gap-3 mb-6 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-indigo-500/20">R</div>
        {!isCollapsed && (
          <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap overflow-hidden">
            Russian<span className="text-indigo-400">Master</span>
          </h1>
        )}
      </div>

      <nav className="px-3 flex flex-col gap-1.5 overflow-hidden shrink-0">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (currentView === AppView.DICTATION && item.id === AppView.DASHBOARD);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group relative w-full ${
                isActive ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <NavIcon>{item.icon}</NavIcon>
              {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
              
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none">
                  {item.label}
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Dịch thuật AI Section */}
      {!isCollapsed && (
        <div className="mt-8 px-4 flex flex-col gap-4 overflow-y-auto flex-1 pb-6 scrollbar-hide">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
            <span>Dịch thuật AI</span>
            <button 
              onClick={swapLanguages}
              className="text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              HOÁN ĐỔI
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative group">
              <span className="absolute top-2 right-2 text-[8px] font-black text-indigo-500/40 select-none uppercase">{isRuToVi ? "Ru" : "Vi"}</span>
              <textarea 
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Nhập nội dung cần dịch..."
                className="w-full bg-gray-900 border border-white/5 rounded-xl px-3 py-3 text-xs text-white placeholder:text-gray-700 outline-none focus:border-indigo-500/50 min-h-[90px] resize-none transition-all shadow-inner"
              />
            </div>
            
            <button 
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg"
            >
              {isTranslating && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              {isTranslating ? "ĐANG DỊCH..." : "DỊCH NHANH"}
            </button>

            <div className="relative">
              <span className="absolute top-2 right-2 text-[8px] font-black text-emerald-500/40 select-none uppercase">{isRuToVi ? "Vi" : "Ru"}</span>
              <div className="w-full bg-indigo-950/20 border border-indigo-500/10 rounded-xl px-3 py-3 text-xs text-indigo-100 min-h-[90px] break-words whitespace-pre-wrap leading-relaxed shadow-inner">
                {translatedText || <span className="text-gray-700 italic font-medium">Kết quả dịch ngắn gọn, sát nghĩa sẽ hiện ở đây...</span>}
              </div>
            </div>
          </div>
          
          <p className="text-[9px] text-center text-gray-700 italic px-2">
            AI tự động tối ưu hóa bản dịch dựa trên ngữ cảnh tiếng Nga/Việt.
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
