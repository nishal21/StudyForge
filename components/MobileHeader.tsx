import React from 'react';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
}

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);


export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onMenuClick }) => {
    return (
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/80 flex-shrink-0 z-30">
            <button onClick={onMenuClick} className="text-slate-200 hover:text-white p-2 -ml-2">
                <MenuIcon />
            </button>
            <h1 className="text-lg font-bold text-white">{title}</h1>
            <div className="w-8"></div>
        </header>
    );
}