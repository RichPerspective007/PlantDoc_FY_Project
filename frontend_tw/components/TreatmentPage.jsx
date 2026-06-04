// Helper function to determine severity color based on multi-language strings
const isHighSeverity = (severityStr) => 
  ["High", "उच्च", "উচ্চ", "అధిక", "அதிகம்", "जास्त"].includes(severityStr);

export function TreatPg({ translations, onBack, user }) {
  return (
    // min-h-screen and flex-col handle the layout shell natively
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      
      {/* Sticky Header / Shell */}
      <div className="sticky top-0 z-50 flex items-center gap-4 px-6 py-4 border-b bg-emerald-950 border-white/10">
        
        <button 
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
        >
          {translations.back}
        </button>
        
        <span className="flex-1 text-lg font-bold text-slate-50">
          📋 {translations.treatment}
        </span>
        
        {/* User Chip */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            👤 {user.name}
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          
          {translations.treatments.map((treatment, index) => (
            <div 
              key={index} 
              className="flex flex-col p-6 transition-all bg-white border border-slate-200 rounded-2xl hover:shadow-lg hover:-translate-y-1"
            >
              {/* Card Header: Name & Severity */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-slate-800">
                  {treatment.name}
                </span>
                
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  isHighSeverity(treatment.severity) 
                    ? "bg-red-100 text-red-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {treatment.severity}
                </span>
              </div>
              
              {/* Card Body: Plant & Cure */}
              <div className="mb-2 text-sm font-medium text-slate-500">
                🌱 {treatment.plant}
              </div>
              <div className="text-sm leading-relaxed text-slate-700">
                💊 {treatment.cure}
              </div>
              
            </div>
          ))}
          
        </div>
      </div>
    </div>
  );
}