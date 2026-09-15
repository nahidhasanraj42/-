import React, { useState, useEffect, useRef } from 'react';
import { BookmarkPlus, Volume2, Copy, Check } from 'lucide-react';
import { speakText } from '../utils/audioUtils';

interface FloatingSelectionMenuProps {
  onAddToNotebook: (text: string, source?: string) => void;
}

export const FloatingSelectionMenu: React.FC<FloatingSelectionMenuProps> = ({ onAddToNotebook }) => {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length < 2) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      // Avoid showing menu if selection is inside an input or textarea
      const anchorNode = selection.anchorNode;
      const targetElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      if (
        targetElement?.tagName === 'INPUT' ||
        targetElement?.tagName === 'TEXTAREA' ||
        menuRef.current?.contains(targetElement as Node)
      ) {
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setSelectedText(text);
          // Position menu centered above selection, with scroll offset
          const menuX = Math.max(16, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 140));
          const menuY = rect.top - 48 > 10 ? rect.top - 48 : rect.bottom + 10;
          setPosition({ x: menuX, y: menuY });
        }
      } catch (err) {
        console.warn('Selection rect calculation error:', err);
      }
    };

    const handleMouseUp = () => {
      setTimeout(handleSelection, 20);
    };

    const handleTouchEnd = () => {
      setTimeout(handleSelection, 50);
    };

    const handleScrollOrResize = () => {
      // Hide floating menu on heavy scroll to prevent misplaced tooltips
      setPosition(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScrollOrResize);
    };
  }, []);

  if (!position || !selectedText) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Auto detect arabic or bengali phonetics
    const isArabic = /[\u0600-\u06FF]/.test(selectedText);
    speakText(selectedText, isArabic ? 'ar' : 'bn');
  };

  const handleSaveToNotebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToNotebook(selectedText, 'সিলেকশন থেকে নোট');
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setPosition(null);
    }, 1500);
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
      className="bg-slate-900/95 backdrop-blur-md text-white px-2.5 py-1.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150 select-none text-xs font-medium"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleSaveToNotebook}
        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-2xs font-semibold whitespace-nowrap"
        title="স্টাডি নোটবুকে সেভ করুন"
      >
        {added ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-200" />
            <span>জমা হয়েছে!</span>
          </>
        ) : (
          <>
            <BookmarkPlus className="w-3.5 h-3.5 text-emerald-200" />
            <span>নোটবুকে রাখুন</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleSpeak}
        className="px-2 py-1 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-1 transition-colors"
        title="উচ্চারণ শুনুন"
      >
        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>শুনুন</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="px-2 py-1 rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-1 transition-colors"
        title="কপি করুন"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-300" />
        )}
        <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
      </button>
    </div>
  );
};
