import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
        className={`bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-lg ${className}`}
        onClick={onClick}
    >
      {children}
    </div>
  );
};