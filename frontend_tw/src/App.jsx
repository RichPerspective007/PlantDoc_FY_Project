import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";

// Pages
import { Landing } from "../components/LandingPage";
import { LangPg } from "../components/LanguagePage";
import { DetectPg } from "../components/DetectPage";
import { TreatPg } from "../components/TreatmentPage";
import { AuthPg } from "../components/AuthPage";
import { CommPg } from "../components/CommunityPage";

// Global CSS
import "./App.css";

// A wrapper component to protect routes that require login
function ProtectedRoute({ children }) {
  const { user, loading } = useAppContext();
  
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50">Loading...</div>;
  
  if (!user) {
    // If not logged in, send them to auth
    return <Navigate to="/auth" replace />;
  }
  return children;
}

function AppRoutes() {
  const { translations, lang, setLang, user } = useAppContext();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing translations={translations} lang={lang} user={user} />} />
      <Route path="/language" element={<LangPg translations={translations} lang={lang} setLang={setLang} />} />
      <Route path="/auth" element={<AuthPg translations={translations} />} />

      {/* Protected Routes */}
      <Route path="/detect" element={
        <ProtectedRoute>
          <DetectPg translations={translations} lang={lang} user={user} />
        </ProtectedRoute>
      } />
      
      <Route path="/treatment" element={
        <ProtectedRoute>
          <TreatPg translations={translations} user={user} />
        </ProtectedRoute>
      } />
      
      <Route path="/community" element={
        <ProtectedRoute>
          <CommPg translations={translations} lang={lang} user={user} />
        </ProtectedRoute>
      } />

      {/* Fallback for unknown URLs */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;