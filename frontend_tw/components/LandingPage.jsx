import { LANGUAGES } from "../data/LangTrans";
import { Navbar } from "./Navbar";

export function Landing({ translations, lang, go, openLang, user }) {
  // Renamed 'c' to 'currentLanguage' for readability
  const currentLanguage = LANGUAGES.find(l => l.code === lang);

  return (
    // min-h-screen ensures it takes up the full viewport height.
    // bg-emerald-950 is the Tailwind equivalent of your old '--forest' variable.
    <div className="relative min-h-screen overflow-hidden bg-emerald-950 font-sans">
      
      {/* Background Gradients (Replacing the complex CSS pseudo-elements) */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-800/40 via-transparent to-transparent"></div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent"></div>

      <Navbar 
        appName={translations.appName} 
        currentLanguage={currentLanguage} 
        openLang={openLang} 
      />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-5 text-center gap-7">
        
        {/* Tagline / Eyebrow */}
        <div className="px-5 py-1.5 text-xs font-bold tracking-[0.15em] uppercase border rounded-full text-emerald-400 bg-emerald-900/40 border-emerald-700/50">
          {translations.tagline}
        </div>
        
        {/* Main Header */}
        <h1 className="text-4xl leading-tight md:text-6xl text-slate-50 font-serif whitespace-pre-line">
          {translations.heroTitle.split('\n')[0]}<br/>
          <em className="italic text-amber-300">{translations.heroTitle.split('\n')[1]}</em>
        </h1>
        
        {/* Subheader */}
        <p className="max-w-lg text-base leading-relaxed text-slate-300">
          {translations.heroSub}
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          
          <button 
            onClick={() => go("detect")}
            className="px-7 py-3.5 text-sm font-bold tracking-wide transition-all translate-y-0 rounded-full shadow-lg text-slate-50 bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-emerald-900/50"
          >
            🔬 {translations.detectBtn}
          </button>
          
          <button 
            onClick={() => go("community")}
            className="px-6 py-3.5 text-sm font-medium transition-colors border rounded-full text-slate-200 bg-transparent border-white/20 hover:bg-white/10 hover:border-white/40"
          >
            👥 {translations.communityBtn}
          </button>
          
          <button 
            onClick={() => go("treatment")}
            className="px-6 py-3.5 text-sm font-medium transition-colors border rounded-full text-slate-200 bg-transparent border-white/20 hover:bg-white/10 hover:border-white/40"
          >
            📋 {translations.treatmentBtn}
          </button>

        </div>
      </div>
    </div>
  );
}