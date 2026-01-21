
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';
import { lookupWord, DictionaryResult } from '../services/geminiService';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6 flex items-center justify-center shrink-0">{children}</div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isDarkMode, toggleTheme }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [wordInput, setWordInput] = useState("");
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const cleanWord = wordInput.trim().replace(/[.,!?;:]/g, "");
    if (!cleanWord || cleanWord.length < 2) {
      setResult(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await lookupWord(cleanWord);
        setResult(data);
      } catch (e) {
        setResult(null);
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [wordInput]);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Thư viện', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg> },
    { id: AppView.VIDEO_DICTATION, label: 'Video', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 022 2z" /></svg> },
    { id: AppView.VOCABULARY, label: 'Từ vựng', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-8.494h18" /></svg> },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-72'} transition-all duration-300 flex flex-col relative z-[60] shadow-2xl shrink-0 h-full border-r ${isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-white border-slate-200'}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all z-[70] border border-white/10 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className={`p-4 flex items-center gap-3 mb-6 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 shrink-0">R</div>
        {!isCollapsed && (
          <h1 className={`text-lg font-black tracking-tight animate-in fade-in slide-in-from-left-2 duration-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Russian<span className="text-indigo-600">Master</span>
          </h1>
        )}
      </div>

      <nav className="px-2 flex flex-col gap-1.5 shrink-0">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group relative w-full ${
              currentView === item.id 
              ? (isDarkMode ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600 shadow-sm') 
              : (isDarkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600')
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <NavIcon>{item.icon}</NavIcon>
            {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Tra cứu từ điển */}
      {!isCollapsed && (
        <div className="mt-8 px-4 flex flex-col gap-4 overflow-y-auto flex-1 pb-6 scrollbar-hide animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
            <span>Tra cứu</span>
            {isSearching && <div className="w-2 h-2 border border-indigo-500/50 border-t-indigo-600 rounded-full animate-spin" />}
          </div>

          <div className="flex flex-col gap-3">
            <input 
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              placeholder="Nhập từ cần tra..."
              className={`w-full border rounded-xl px-3 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode ? 'bg-slate-900 border-white/5 text-white placeholder:text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
            />
            
            {result && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className={`p-4 rounded-xl border shadow-sm ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                  <p className={`text-xs font-black mb-2 uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-indigo-800'}`}>{wordInput}</p>
                  <p className={`text-[11px] font-medium leading-relaxed ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>{result.meaning}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Theme Toggle Button - Bottom */}
      <div className={`mt-auto p-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
        {isCollapsed ? (
          /* Collapsed State: Single Moon/Sun Circle */
          <button 
            onClick={toggleTheme}
            className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${isDarkMode ? 'bg-slate-900 text-yellow-400 border border-white/10' : 'bg-slate-100 text-indigo-600 border border-slate-200'}`}
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        ) : (
          /* Expanded State: Sliding Pill */
          <div 
            onClick={toggleTheme}
            className={`relative h-10 rounded-full p-1 cursor-pointer transition-all flex items-center animate-in fade-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-slate-900 border border-white/10' : 'bg-slate-100 border border-slate-200'}`}
          >
            {/* Slider Indicator */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 shadow-md ${isDarkMode ? 'translate-x-[calc(100%+0px)] bg-indigo-600' : 'translate-x-0 bg-white'}`}
            />
            
            <div className={`flex-1 flex justify-center items-center z-10 transition-colors ${!isDarkMode ? 'text-indigo-600' : 'text-slate-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <span className="ml-2 text-[9px] font-black uppercase tracking-widest">Sáng</span>
            </div>
            
            <div className={`flex-1 flex justify-center items-center z-10 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="ml-2 text-[9px] font-black uppercase tracking-widest">Tối</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
