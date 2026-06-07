import { LANGUAGES } from "../data/LangTrans";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../src/context/AppContext";
  

export function LangPg({ translations, tempLang, setTempLang, onConfirm }) {
  const navigate = useNavigate();
  const { setLang } = useAppContext();

  return (
    // min-h-screen ensures full height, bg-slate-50 replaces '--cream'
    <div className="min-h-screen font-sans bg-slate-50 text-slate-900">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-emerald-950">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 text-sm rounded-md bg-emerald-500 text-slate-50">
            🌿
          </div>
          <span className="text-xl tracking-wide text-slate-50 font-serif">
            PlantDoc
          </span>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="text-sm font-medium transition-colors text-slate-300 hover:text-white"
        >
          {translations.back}
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex flex-col items-center px-5 py-12 mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl text-center md:text-4xl text-slate-900 font-serif">
          {translations.chooseLanguage}
        </h1>
        <p className="mb-8 text-base text-center text-slate-500">
          {translations.langSub}
        </p>

        {/* Language Grid */}
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
          {LANGUAGES.map((language) => {
            const isSelected = tempLang === language.code;
            
            return (
              <div 
                key={language.code} 
                onClick={() => setTempLang(language.code)}
                className={`flex flex-col items-center gap-2 p-6 transition-all border-2 cursor-pointer rounded-2xl hover:-translate-y-1 hover:shadow-md
                  ${isSelected 
                    ? "border-emerald-600 bg-emerald-50/50 shadow-sm" 
                    : "border-slate-200 bg-white hover:border-emerald-300"
                  }`}
              >
                <div className="text-4xl">{language.flag}</div>
                <div className="text-lg font-bold text-slate-800">{language.native}</div>
                <div className="text-xs font-medium text-slate-500">{language.label}</div>
              </div>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button 
          onClick={onConfirm}
          className="px-12 py-4 mt-12 text-sm font-bold tracking-wide text-white transition-colors rounded-full bg-emerald-950 hover:bg-emerald-800"
        >
          {translations.continue}
        </button>
      </div>
    </div>
  );
}