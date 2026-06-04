import { createContext, useContext, useState, useEffect } from "react";
import { T } from "../../data/LangTrans";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [lang, setLang] = useState("en");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive translations dynamically based on current language
  const translations = T[lang] || T.en;

  // On initial load, check if user is already logged in via localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedName = localStorage.getItem("name");
    const savedPhone = localStorage.getItem("phone");

    if (token && savedName && savedPhone) {
      setUser({ name: savedName, phone: savedPhone });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("phone");
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ lang, setLang, translations, user, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to easily consume the context in any component
export function useAppContext() {
  return useContext(AppContext);
}