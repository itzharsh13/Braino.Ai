import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Footer from "./components/Footer";
import ChatInterface from "./components/ChatInterface";
import WellnessTools from "./components/WellnessTools";
import MindGames from "./components/MindGames";
import AudioPlayer from "./components/AudioPlayer";
import MentalHealthResources from "./components/MentalHealthResources";
import MoodTracker from "./components/MoodTracker";
import FaceEmotionScanner from "./components/FaceEmotionScanner";
import Scene3D from "./components/Scene3D";
import AmbientBackground from "./components/AmbientBackground";
import AuthPage from "./components/AuthPage";

const AUTH_STORAGE_KEY = "braino_auth_token";
const USER_STORAGE_KEY = "braino_auth_user";

function App() {
  const [showChat, setShowChat] = useState(false);
  const [view, setView] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");
    const handleHashChange = () => {
      if (window.location.hash === "#wellness") setView("wellness");
      else if (window.location.hash === "#games") setView("games");
      else if (window.location.hash === "#resources") setView("resources");
      else if (window.location.hash === "#mood") setView("mood");
      else if (window.location.hash === "#emotion") setView("emotion");
      else setView("home");
    };

    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(Boolean(token));
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleAuthenticated = (authData) => {
    const nextUser = authData?.user ?? authData;
    const nextToken = authData?.access_token ?? localStorage.getItem(AUTH_STORAGE_KEY);

    if (nextToken) {
      localStorage.setItem(AUTH_STORAGE_KEY, nextToken);
    }

    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }

    setIsAuthenticated(Boolean(nextToken));
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);
    setShowChat(false);
    setView("home");
    window.location.hash = "";
  };

  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app-shell">
      <AmbientBackground />
      <Scene3D darkMode />
      <div className="relative z-10">
        {showChat ? (
          <ChatInterface
            onClose={() => setShowChat(false)}
            onOpenEmotionScanner={() => {
              setShowChat(false);
              setView("emotion");
              window.location.hash = "#emotion";
            }}
            user={user}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <Navbar
              onStartChat={() => setShowChat(true)}
              setView={setView}
              activeView={view}
              user={user}
              onLogout={handleLogout}
            />

            {view === "wellness" ? (
              <WellnessTools />
            ) : view === "games" ? (
              <MindGames />
            ) : view === "resources" ? (
              <MentalHealthResources />
            ) : view === "mood" ? (
              <MoodTracker />
            ) : view === "emotion" ? (
              <FaceEmotionScanner onStartChat={() => setShowChat(true)} />
            ) : (
              <>
                <Hero onStartChat={() => setShowChat(true)} />
                <Features setView={setView} onStartChat={() => setShowChat(true)} />
              </>
            )}

            <Footer />
            <AudioPlayer />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
