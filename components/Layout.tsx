
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const navItems = [
    { id: AppTab.DASHBOARD, label: 'Home', icon: '🏠' },
    { id: AppTab.QUIZ, label: 'Live Quiz', icon: '⚡' },
    { id: AppTab.WORKFLOW, label: 'n8n Config', icon: '⚙️' },
    { id: AppTab.CURRENT_AFFAIRS, label: 'News AI', icon: '🌍' },
    { id: AppTab.IMAGE_ANALYZE, label: 'Scan Notes', icon: '📸' },
    { id: AppTab.SYLLABUS, label: 'Syllabus', icon: '📚' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-6 sticky top-0 h-screen">
        <h1 className="text-2xl font-bold mb-10 text-indigo-400 italic tracking-tighter">EducateUrSelf AI</h1>
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span> 
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Workflow Engine Active</p>
          </div>
          <p className="text-[10px] text-slate-600">v2.1 Build • Civil Services Prep</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 pb-24 md:pb-0 overflow-x-hidden">
        <header className="glass sticky top-0 z-30 px-6 py-4 border-b border-slate-200/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {navItems.find(n => n.id === activeTab)?.icon}
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Aspirant Profile</p>
               <p className="text-xs font-bold text-slate-500">UPSC / BPSC 2025</p>
             </div>
             <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
               JS
             </div>
          </div>
        </header>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 px-2 py-2 flex justify-around z-40 pb-safe">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              activeTab === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
