
import React from 'react';

interface GlassModalProps {
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDangerous?: boolean;
}

const GlassModal: React.FC<GlassModalProps> = ({ onClose, onConfirm, title, message, confirmText, isDangerous }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Content */}
      <div className="glass w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden transform animate-in fade-in zoom-in duration-300">
        <div className="p-10 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isDangerous ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-[#fd780f]'}`}>
            {isDangerous ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">{message}</p>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition active:scale-95 ${isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-[#fd780f] hover:bg-[#e46a0a] shadow-[#fd780f]/20'}`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassModal;
