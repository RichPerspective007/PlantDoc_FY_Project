import { LANGUAGES } from "../data/LangTrans";
import { useState, useRef, useEffect, useMemo } from "react";

export function CommPg({ translations, lang, onBack, onLanguageChange, user }) {
  const [tab, setTab] = useState("chat");
  const [msgs, setMsgs] = useState(translations.communityMessages);
  const [inp, setInp] = useState(""); 
  const endRef = useRef();
  
  const currentLanguage = useMemo(() => LANGUAGES.find(l => l.code === lang), [lang]);
  
  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  
  const send = () => { 
    const m = inp.trim(); 
    if (!m) return; 
    setInp(""); 
    setMsgs(p => [
      ...p, 
      { 
        user: "You", 
        text: m, 
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), 
        avatar: "Y", 
        mine: true 
      }
    ]);
  };
  
  const groups = [
    { name: translations.groupName, count: "1,247", icon: "🌾" }, 
    { name: "Organic Farming", count: "834", icon: "🌱" }, 
    { name: "Pest Control", count: "562", icon: "🐛" }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-50 text-slate-900">
      
      {/* ── TOP NAV SHELL ── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-emerald-950 border-white/10 shrink-0">
        <button onClick={onBack} className="px-4 py-2 text-sm font-medium transition-colors border rounded-lg bg-white/10 border-white/20 text-white/80 hover:bg-white/20">
          {translations.back}
        </button>
        <span className="flex-1 text-lg font-bold text-slate-50">👥 {translations.communityTitle}</span>
        
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            👤 {user.name}
          </div>
        )}
        <button
          onClick={onLanguageChange}
          className="px-4 py-2 text-xs font-bold transition-colors border rounded-full bg-emerald-900/50 text-emerald-100 border-emerald-700 hover:bg-emerald-800"
        >
          {currentLanguage?.flag} {currentLanguage?.native}
        </button>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: SIDEBAR */}
        <div className="flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="px-5 py-4 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Groups
          </div>
          
          <div className="flex flex-col gap-1 px-2">
            {groups.map((g, i) => (
              <div 
                key={i} 
                onClick={() => setTab("chat")}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  tab === "chat" && i === 0 
                    ? "bg-emerald-50 border border-emerald-100" 
                    : "border border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-center w-10 h-10 text-lg rounded-full bg-emerald-800 text-slate-50 shrink-0">
                  {g.icon}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold truncate text-slate-800">{g.name}</span>
                  <span className="text-xs text-slate-500">{g.count} {translations.groupMembers}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Profile Tab (Sticks to bottom) */}
          <div 
            onClick={() => setTab("profile")}
            className={`flex items-center gap-3 p-4 mt-auto border-t cursor-pointer transition-colors ${
              tab === "profile" ? "bg-amber-50 border-t-amber-200" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white bg-amber-500 rounded-full shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate text-slate-800">{user?.name}</span>
              <span className="text-xs text-slate-500">{translations.profile}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: MAIN CONTENT AREA */}
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50">
          
          {tab === "chat" ? (
            /* ── CHAT VIEW ── */
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center justify-center w-10 h-10 text-lg rounded-full bg-emerald-900 text-slate-50 shrink-0">
                  🌾
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-bold text-slate-800">{translations.groupName}</span>
                  <span className="text-xs font-medium text-emerald-600">● {translations.online} · 1,247 {translations.groupMembers}</span>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5">
                {msgs.map((m, i) => (
                  <div key={i} className={`flex w-full ${m.mine ? "justify-end" : "justify-start"}`}>
                    <div className={`flex gap-3 max-w-[75%] ${m.mine ? "flex-row-reverse" : "flex-row"}`}>
                      {!m.mine && (
                        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-emerald-800 shrink-0 mt-1">
                          {m.avatar}
                        </div>
                      )}
                      <div className={`flex flex-col p-4 rounded-2xl shadow-sm ${
                        m.mine 
                          ? "bg-emerald-700 text-white rounded-tr-sm" 
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                      }`}>
                        {!m.mine && <span className="mb-1 text-xs font-bold text-emerald-700">{m.user}</span>}
                        <span className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</span>
                        <span className={`text-[10px] mt-2 text-right ${m.mine ? "text-emerald-200" : "text-slate-400"}`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Input Bar */}
              <div className="flex items-center gap-3 p-4 bg-white border-t border-slate-200 shrink-0">
                <input 
                  className="flex-1 px-5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  placeholder={translations.typeMessage} 
                  value={inp} 
                  onChange={e => setInp(e.target.value)} 
                  onKeyDown={e => e.key === "Enter" && send()} 
                />
                <button 
                  className="flex items-center justify-center w-12 h-12 text-lg text-white transition-transform bg-emerald-800 rounded-full hover:bg-emerald-700 active:scale-95 shrink-0 shadow-sm" 
                  onClick={send}
                >
                  ↑
                </button>
              </div>
            </div>
          ) : (
            /* ── PROFILE VIEW ── */
            <div className="flex flex-col h-full p-6 overflow-y-auto gap-6 max-w-4xl mx-auto w-full">
              
              {/* Dedicated Back Button */}
              <div className="flex justify-start">
                <button 
                  onClick={() => setTab("chat")}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors bg-white border-2 rounded-xl text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-700 active:scale-95 shadow-sm"
                >
                  ← Back to Chat
                </button>
              </div>

              {/* Profile Header Card */}
              <div className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white bg-amber-500 rounded-full shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-800 font-serif">{user?.name}</span>
                    <span className="text-sm text-slate-500">Farmer · Joined Jan 2024</span>
                  </div>
                </div>
                <button className="px-5 py-2.5 text-sm font-bold transition-colors border-2 rounded-xl text-slate-600 bg-slate-50 border-slate-200 hover:border-emerald-500 hover:text-emerald-700">
                  {translations.editProfile}
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-2xl font-bold text-emerald-700 font-serif">48</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{translations.myPosts}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-2xl font-bold text-emerald-700 font-serif">3</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{translations.joinedGroups}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-2xl font-bold text-emerald-700 font-serif">124</span>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Replies</span>
                </div>
              </div>

              {/* Info & Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Col: Info Details */}
                <div className="flex flex-col gap-4 md:col-span-1">
                  <div className="flex flex-col p-5 bg-white border border-slate-200 rounded-2xl shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 text-lg bg-emerald-50 rounded-xl shrink-0">📍</div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{translations.location}</span>
                        <span className="text-sm font-semibold text-slate-700">Howrah, West Bengal</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 text-lg bg-emerald-50 rounded-xl shrink-0">🌾</div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{translations.cropType}</span>
                        <span className="text-sm font-semibold text-slate-700">Tomato, Potato, Rice</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 text-lg bg-emerald-50 rounded-xl shrink-0">📅</div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{translations.memberSince}</span>
                        <span className="text-sm font-semibold text-slate-700">January 2024</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Col: Recent Posts */}
                <div className="flex flex-col md:col-span-2">
                  <h3 className="mb-4 text-lg font-bold text-slate-800 font-serif">{translations.myPosts}</h3>
                  <div className="flex flex-col gap-3">
                    {[
                      { text: "Has anyone tried neem oil for powdery mildew on cucumbers? Got great results last week!", time: "2 days ago" },
                      { text: "My rice crop looks pale — could be iron deficiency. Will test the soil tomorrow.", time: "5 days ago" },
                      { text: "Early blight on my tomatoes again this season. Going with copper fungicide as advised.", time: "1 week ago" },
                    ].map((p, i) => (
                      <div key={i} className="flex flex-col p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors">
                        <span className="text-sm leading-relaxed text-slate-700">{p.text}</span>
                        <span className="text-xs text-slate-400 mt-3">{p.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}