
import React, { useState, useEffect } from 'react';
import { ArrowUp, Plus, MessageCircle } from 'lucide-react';

interface FloatingButtonsProps {
  onAiAssistantClick: () => void;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onAiAssistantClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-8 right-6 z-50 flex flex-col gap-3">
      {isVisible && (
        <button 
          onClick={scrollToTop}
          className="w-12 h-12 bg-white text-slate-800 rounded-full shadow-lg flex items-center justify-center border border-slate-100 hover:bg-slate-50 transition-all animate-in fade-in zoom-in duration-300"
        >
          <ArrowUp size={24} />
        </button>
      )}
      <button 
        className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all"
      >
        <Plus size={24} />
      </button>
      <button 
        onClick={onAiAssistantClick}
        className="w-14 h-14 bg-white border-2 border-blue-500 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-all overflow-hidden"
      >
        <img src="https://picsum.photos/seed/avatar/100/100" alt="Bot" className="w-full h-full object-cover" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
      </button>
    </div>
  );
};

export default FloatingButtons;
