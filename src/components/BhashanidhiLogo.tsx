import React from 'react';

interface BhashanidhiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BhashanidhiLogo: React.FC<BhashanidhiLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', iconSize: 32, textTitle: 'text-base', textSub: 'text-[10px]' },
    md: { box: 'w-10 h-10', iconSize: 40, textTitle: 'text-lg', textSub: 'text-xs' },
    lg: { box: 'w-16 h-16', iconSize: 64, textTitle: 'text-2xl', textSub: 'text-sm' },
    xl: { box: 'w-24 h-24', iconSize: 96, textTitle: 'text-3xl', textSub: 'text-base' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon Emblem: Treasure Gem + Open Book + Multilingual Symbols (অ, ض, A) */}
      <div
        className={`${currentSize.box} relative rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-850 to-slate-900 p-0.5 shadow-md flex items-center justify-center shrink-0 border border-emerald-500/30 overflow-hidden group`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-emerald-400/10 to-transparent pointer-events-none" />

        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 drop-shadow-xs"
        >
          <defs>
            <linearGradient id="bnGemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="bnBookGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {/* Open Book Base (জ্ঞানের আধার) */}
          <path
            d="M8 48C14 44 24 44 32 48C40 44 50 44 56 48V28C50 24 40 24 32 28C24 24 14 24 8 28V48Z"
            fill="url(#bnBookGrad)"
            opacity="0.25"
          />
          <path
            d="M8 48C14 44 24 44 32 48C40 44 50 44 56 48"
            stroke="url(#bnBookGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M32 28V48"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1 2"
          />

          {/* Central Treasure Gem / Diamond (নিধি / রত্ন) */}
          <path
            d="M32 10L44 22L32 38L20 22L32 10Z"
            fill="url(#bnGemGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Facet Lines of the Treasure */}
          <path
            d="M20 22H44M32 10V38M25 22L32 38M39 22L32 38"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.8"
          />

          {/* Bengali letter 'অ' glyph mark (Left wing) */}
          <text
            x="14"
            y="42"
            fill="#a7f3d0"
            fontSize="9"
            fontWeight="bold"
            fontFamily="Hind Siliguri, sans-serif"
          >
            অ
          </text>

          {/* Arabic letter 'ض' glyph mark (Right wing) */}
          <text
            x="45"
            y="42"
            fill="#fde68a"
            fontSize="9"
            fontWeight="bold"
            fontFamily="Amiri, serif"
          >
            ض
          </text>

          {/* Sparkle Star at Crown (ভাষার জ্যোতি) */}
          <path
            d="M32 4L33.5 7.5L37 9L33.5 10.5L32 14L30.5 10.5L27 9L30.5 7.5L32 4Z"
            fill="#fbbf24"
          />
        </svg>
      </div>

      {/* Brand Title and Subtitle */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-slate-900 font-bengali ${currentSize.textTitle}`}
            >
              ভাষানিধি
            </span>
          </div>
          <span className={`text-slate-500 font-bengali ${currentSize.textSub}`}>
            ল্যাঙ্গুয়েজ ব্রিজ একাডেমি
          </span>
        </div>
      )}
    </div>
  );
};
