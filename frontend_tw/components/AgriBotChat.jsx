import { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../src/context/AppContext";

export function AgriBotChat({ diseaseResult }) {
  // Global context instead of props
  const { translations, lang, user, setUser } = useAppContext();

  // Local Chat State
  const [msgs, setMsgs] = useState([{ r: "b", txt: translations.chatBotResponses?.default || "Hello! How can I help you with your crops today?" }]);
  const [inp, setInp] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActive] = useState(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Refs
  const endRef = useRef();
  const sessionId = useRef(crypto.randomUUID());
  const recognRef = useRef(null);

  // Check Voice Support
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  // Load Session History
  useEffect(() => {
    if (!user?.name) return;
    setLoadingHist(true);
    fetch(`${import.meta.env.VITE_API_URL}/showconvolist`,{
      credentials: "include" // Important for cookie-based sessions
    })
      .then(r => r.json())
      .then(ids => setSessions(ids))
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.clear();
          setUser(null);
        } else {
          console.error("Error fetching session history:", err);
        }
      })
      .finally(() => setLoadingHist(false));
  }, [user]);

  // Session Handlers
  const loadSession = async (sid) => {
    setActive(sid);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/internalconvo?session_id=${sid}`,{
        credentials: "include" // Important for cookie-based sessions
      }).catch(err => {
        if (err.response?.status === 401) {
          localStorage.clear();
          setUser(null);
        }
      });
      const data = await r.json();
      setMsgs(data.map(m => ({ r: m.role === "human" ? "u" : "b", txt: m.text })));
      sessionId.current = sid;
    } catch (err) {
      console.error(err);
    }
  };

  const newSession = () => {
    setActive(null);
    sessionId.current = crypto.randomUUID();
    setMsgs([{ r: "b", txt: translations.chatBotResponses?.default || "Hello! Let's start a new chat." }]);
  };

  // Chat Submission Handler
  const send = async () => {
    const m = inp.trim();
    if (!m) return;
    setInp("");
    setMsgs(prev => [...prev, { r: "u", txt: m }]);
    setTyping(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: m,
          disease: diseaseResult || null, // Passes the current disease if one is on screen
          session_id: sessionId.current,
          language: lang
        }),
        credentials: "include" // Important for cookie-based sessions
      }).catch(err => {
        if (err.response?.status === 401) {
          localStorage.clear();
          setUser(null);
        }
      });
      const data = await response.json();
      setTyping(false);
      
      if (!sessions.includes(sessionId.current)) {
        setSessions(prev => [sessionId.current, ...prev]);
        setActive(sessionId.current);
      }
      setMsgs(prev => [...prev, { r: "b", txt: data.reply || "No response from server" }]);
    } catch (err) {
      console.error(err);
      setTyping(false);
      setMsgs(prev => [...prev, { r: "b", txt: "Server error" }]);
    }
  };

  // Voice Handlers
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    const locales = { hi: "hi-IN", bn: "bn-IN", te: "te-IN", ta: "ta-IN", mr: "mr-IN" };
    recognition.lang = locales[lang] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInp(prev => prev ? prev + " " + transcript : transcript);
    };
    recognRef.current = recognition;
    recognition.start();
  }, [lang]);

  const stopVoice = useCallback(() => {
    recognRef.current?.stop();
    setListening(false);
  }, []);

  const toggleVoice = () => listening ? stopVoice() : startVoice();

  return (
    <>
      {/* LEFT COL: HISTORY SIDEBAR */}
      <div className="flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="px-4 py-3 text-xs font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100">
          Past Sessions
        </div>
        <button onClick={newSession} className="mx-3 my-3 px-4 py-2.5 text-sm font-bold text-white transition-transform bg-emerald-600 rounded-lg hover:bg-emerald-500 active:scale-95 shadow-sm">
          + New session
        </button>
        
        <div className="flex-1 px-2 pb-4 overflow-y-auto">
          {loadingHist ? (
            <div className="p-4 text-sm text-center text-slate-400">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-sm text-center text-slate-400">No sessions yet</div>
          ) : (
            sessions.map(sid => (
              <div 
                key={sid} 
                onClick={() => loadSession(sid)}
                className={`p-3 mb-1 text-sm rounded-lg cursor-pointer transition-colors border ${
                  activeSession === sid 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold" 
                    : "border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <div className="truncate">{sid.slice(0, 8)}...</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WE USE A FRAGMENT HERE SO THIS COMPONENT JUST DROPS TWO COLUMNS INTO DETECT PAGE */}
      
      {/* RIGHT COL: AGRIBOT CHAT ENGINE */}
      <div className="flex flex-col w-80 bg-white border-l border-slate-200 shrink-0 absolute right-0 top-[69px] bottom-0">
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-bold border-b text-emerald-800 border-slate-100 bg-slate-50/50">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          AgriBot 🤖
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50/30">
          {msgs.map((m, i) => (
            <div key={i} className={`flex w-full ${m.r === 'u' ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 text-sm rounded-2xl whitespace-pre-wrap break-words ${
                m.r === 'u' 
                  ? "bg-emerald-600 text-white rounded-br-sm shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
              }`}>
                {m.txt}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start w-full">
              <div className="flex items-center gap-1.5 p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex items-center gap-2 p-3 bg-white border-t border-slate-100">
          <input
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-full outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            placeholder={listening ? "🎙️ Listening..." : translations.chatPlaceholder || "Type here..."}
            value={inp}
            onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              title={listening ? "Stop" : "Speak"}
              className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all shrink-0 ${
                listening ? "bg-red-50 border-red-200 animate-pulse" : "bg-slate-50 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
              }`}
            >
              {listening ? "⏹" : "🎙️"}
            </button>
          )}
          <button 
            onClick={send}
            className="flex items-center justify-center w-10 h-10 text-white transition-transform bg-emerald-600 rounded-full hover:bg-emerald-500 active:scale-95 shrink-0 shadow-sm"
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}