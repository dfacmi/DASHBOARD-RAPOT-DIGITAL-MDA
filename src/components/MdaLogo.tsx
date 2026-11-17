import React from 'react';

export const MdaLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}> = ({ size = 'md', showText = true, className = '' }) => {
  const iconDims =
    size === 'sm' ? 'h-7 w-auto' : size === 'lg' ? 'h-12 w-auto' : 'h-9 w-auto';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        viewBox="0 0 116 44"
        className={iconDims}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="MDA Logo"
      >
        <defs>
          <linearGradient id="mdaGrad" x1="0" y1="0" x2="116" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E676" />
            <stop offset="55%" stopColor="#00C49A" />
            <stop offset="100%" stopColor="#00B0FF" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="112" height="40" rx="11" fill="#0F172A" />
        {/* Stylized interlocking MDA monogram inspired by the official PDF */}
        <path
          d="M14 31V15.5C14 13.5 15.6 12 17.6 12C19 12 20.2 12.7 20.9 13.9L25.5 22L30.1 13.9C30.8 12.7 32 12 33.4 12C35.4 12 37 13.5 37 15.5V31H31.5V22.2L27.5 29.2C26.7 30.6 24.3 30.6 23.5 29.2L19.5 22.2V31H14Z"
          fill="url(#mdaGrad)"
        />
        <path
          d="M42 12H52.5C60.5 12 66 16.3 66 22C66 27.7 60.5 31 52.5 31H42V12ZM47.8 17V26H52.3C56.8 26 59.8 24.4 59.8 21.5C59.8 18.6 56.8 17 52.3 17H47.8Z"
          fill="url(#mdaGrad)"
        />
        <path
          d="M70 31L80.2 12H86.6L96.8 31H90.5L88.6 27.2H78.2L76.3 31H70ZM80.4 22.5H86.4L83.4 16.5L80.4 22.5Z"
          fill="url(#mdaGrad)"
        />
      </svg>
      {showText && (
        <div className="leading-[1.08] text-left">
          <div className="font-display font-bold text-slate-900 text-xs tracking-tight whitespace-nowrap">
            Muslim Digital
          </div>
          <div className="font-display font-semibold text-emerald-700 text-[11px] whitespace-nowrap">
            Academy
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentAvatar: React.FC<{
  name: string;
  fotoUrl?: string;
  className?: string;
}> = ({ name, fotoUrl, className = 'w-12 h-12' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  if (fotoUrl && fotoUrl.trim() !== '') {
    return (
      <img
        src={fotoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`object-cover rounded-xl border border-slate-200 bg-slate-100 ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white font-display font-bold flex items-center justify-center border border-emerald-700/20 select-none ${className}`}
    >
      <span>{initials || 'MS'}</span>
    </div>
  );
};

export const PortfolioArtwork: React.FC<{
  preset?: 'poster' | 'uiux' | 'photo' | 'video';
  title: string;
  className?: string;
}> = ({ preset = 'poster', title, className = '' }) => {
  if (preset === 'uiux') {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-4 flex flex-col justify-between text-white select-none ${className}`}
      >
        <div className="flex items-center justify-between text-[10px] text-emerald-300 font-mono">
          <span>MDA UI/UX</span>
          <span>FIGMA PROTOTYPE</span>
        </div>
        <div className="my-auto mx-auto w-full max-w-[180px] rounded-xl bg-white/10 border border-white/15 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-2 rounded bg-emerald-400" />
            <div className="w-4 h-4 rounded-full bg-sky-400/80" />
          </div>
          <div className="h-10 rounded-lg bg-gradient-to-r from-emerald-500/40 to-sky-500/40 border border-white/10" />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-8 rounded bg-white/10" />
            <div className="h-8 rounded bg-white/10" />
          </div>
          <div className="h-2.5 w-3/4 rounded bg-white/25" />
        </div>
        <div className="text-[11px] font-medium text-slate-200 truncate">{title}</div>
      </div>
    );
  }

  if (preset === 'video') {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-slate-950 via-emerald-950 to-sky-950 p-4 flex flex-col justify-between text-white select-none ${className}`}
      >
        <div className="flex items-center justify-between text-[10px] text-sky-300 font-mono">
          <span>REC 4K</span>
          <span>24 FPS</span>
        </div>
        <div className="my-auto flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
            <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-emerald-300 ml-1" />
          </div>
          <div className="w-full max-w-[160px] h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="w-2/3 h-full bg-gradient-to-r from-emerald-400 to-sky-400" />
          </div>
        </div>
        <div className="text-[11px] font-medium text-slate-200 truncate">{title}</div>
      </div>
    );
  }

  if (preset === 'photo') {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-100 p-4 flex flex-col justify-between text-slate-800 select-none ${className}`}
      >
        <div className="flex items-center justify-between text-[10px] text-teal-700 font-mono">
          <span>ISO 200</span>
          <span>f/2.8 · 50mm</span>
        </div>
        <div className="my-auto mx-auto w-24 h-24 rounded-2xl border-2 border-dashed border-teal-500/50 bg-white/80 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 opacity-85" />
        </div>
        <div className="text-[11px] font-semibold text-slate-700 truncate">{title}</div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 p-4 flex flex-col justify-between text-white select-none ${className}`}
    >
      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-100">
        <span>MDA STUDIO</span>
        <span>VISUAL DESIGN</span>
      </div>
      <div className="my-auto space-y-2">
        <div className="w-10 h-1 bg-white/80 rounded" />
        <div className="font-display font-bold text-base leading-snug line-clamp-3">
          {title}
        </div>
        <div className="text-[11px] text-emerald-50/90">
          Muslim Digital Academy · Darul Fithrah
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 flex-1 rounded bg-white/25" />
        <div className="h-2 w-8 rounded bg-slate-900/40" />
      </div>
    </div>
  );
};
