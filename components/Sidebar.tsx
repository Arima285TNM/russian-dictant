
import React, { useState } from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-6 h-6 flex items-center justify-center shrink-0">{children}</div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Bài học', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg> },
    { id: AppView.VIDEO_DICTATION, label: 'Video', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { id: AppView.VOCABULARY, label: 'Từ vựng', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-8.494h18" /></svg> },
  ];

  return (
    <>
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-gray-950 border-r border-white/5 transition-all duration-300 flex flex-col relative z-[60] shadow-2xl shrink-0 h-full`}>
        {/* Nút Toggle thu gọn nằm ở giữa cạnh phải của sidebar */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all z-[70] border border-white/10"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={`p-6 flex items-center gap-3 mb-10 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-indigo-500/20">R</div>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              Russian<span className="text-indigo-400">Master</span>
            </h1>
          )}
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-1.5 overflow-x-hidden overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.id || (currentView === AppView.DICTATION && item.id === AppView.DASHBOARD);
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all group relative w-full ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <NavIcon>{item.icon}</NavIcon>
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-[100]">
                    {item.label}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
