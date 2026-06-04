import React from 'react';

export function Navbar({ appName, currentLanguage, openLang }) {
  return (
    // z-10 ensures it stays above background elements. 
    // flex and justify-between push the logo and button to opposite sides.
    <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12 bg-transparent">
      
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 text-xl rounded-lg bg-emerald-500 text-slate-50">
          🌿
        </div>
        <span className="text-2xl tracking-wide text-slate-50 font-serif">
          {appName}
        </span>
      </div>

      {/* Language Selector Button */}
      <button 
        onClick={openLang}
        className="px-4 py-2 text-sm font-medium transition-colors border rounded-full text-slate-200 bg-white/10 border-white/20 hover:bg-white/20 font-sans"
      >
        {currentLanguage?.flag} {currentLanguage?.native}
      </button>

    </nav>
  );
}