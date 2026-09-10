import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { 
    sm: 'max-w-sm', 
    md: 'max-w-md', 
    lg: 'max-w-lg', 
    xl: 'max-w-xl', 
    '2xl': 'max-w-2xl', 
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-5xl' 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-slate-850 border border-slate-750 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-750 flex-shrink-0 bg-slate-800">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {/* Footer */}
        {footer && <div className="p-4 border-t border-slate-750 bg-slate-800/80 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
