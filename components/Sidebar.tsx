import React from 'react';
import { View } from '../types';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onApiKeyClear: () => void;
  onResetData: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const ResetDataIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 9v2m0 4h.01"/><path d="M2.45 14.5A10.42 10.42 0 0 0 2 12c0-4.97 4.03-9 9-9a9.78 9.78 0 0 1 6.2 2.3L21 2m-4 6h4V2"/></svg>;


const NavContent: React.FC<Omit<SidebarProps, 'isOpen' | 'setIsOpen'>> = ({ activeView, setActiveView, onApiKeyClear, onResetData }) => (
    <>
        <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-gradient-to-br from-violet-500 to-cyan-500 p-2 rounded-lg shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25278C12 6.25278 10.8333 5 8.5 5C6.16667 5 5 6.25278 5 8.5C5 12.2528 8.5 15.5 12 19L19 12C19 8.5 14.5 5.5 12 6.25278Z" />
            </svg>
            </div>
            <h1 className="text-xl font-bold text-white">StudyForge</h1>
        </div>
        <nav className="flex-1 space-y-2">
            {NAV_ITEMS.map((item) => (
            <a
                key={item.id}
                href="#"
                onClick={(e) => {
                e.preventDefault();
                setActiveView(item.id);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                activeView === item.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
            >
                {activeView === item.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300 blur-md"></div>
                )}
                <div className={`absolute inset-0 rounded-lg ${activeView === item.id ? 'bg-slate-700/50' : ''}`}></div>
                <div className="relative flex items-center gap-3">
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                </div>
            </a>
            ))}
        </nav>
        <div className="mt-auto space-y-2">
            <button
            onClick={onApiKeyClear}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-200"
            >
            <LogoutIcon />
            <span className="font-medium text-sm">Reset API Key</span>
            </button>
            <button
            onClick={onResetData}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-900/40 transition-colors duration-200"
            >
            <ResetDataIcon />
            <span className="font-medium text-sm">Reset App Data</span>
            </button>
        </div>
    </>
);


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onApiKeyClear, onResetData, isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile Menu */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <aside className="w-64 h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/60 p-4 flex flex-col">
            <NavContent activeView={activeView} setActiveView={(v) => { setActiveView(v); setIsOpen(false); }} onApiKeyClear={onApiKeyClear} onResetData={onResetData} />
        </aside>
      </div>
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsOpen(false)}></div>}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-slate-900/70 backdrop-blur-xl border-r border-slate-700/60 p-4 flex-col">
        <NavContent activeView={activeView} setActiveView={setActiveView} onApiKeyClear={onApiKeyClear} onResetData={onResetData} />
      </aside>
    </>
  );
};