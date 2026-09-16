import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, ScanFace, MessageCircle, Save, Loader2 } from "lucide-react";
import useFaceEmotion from "../hooks/useFaceEmotion";
import {
  EMOTION_META,
  EXPRESSION_ORDER,
  saveEmotionSession,
} from "../utils/faceEmotion";
import config, { getAuthHeaders } from "../config";

const tips = [
  "Face the camera directly in good lighting",
  "Keep your face inside the frame",
  "Remove sunglasses or heavy masks for best results",
];

export default function FaceEmotionScanner({ onStartChat }) {
  const {
    videoRef,
    status,
    error,
    detected,
    scores,
    faceFound,
    startCamera,
    stop,
    isActive,
    isLoading,
  } = useFaceEmotion();

  const [saved, setSaved] = useState(false);
  const [logStatus, setLogStatus] = useState("idle");

  useEffect(() => {
    if (detected) saveEmotionSession(detected);
  }, [detected]);

  const handleToggle = async () => {
    if (isActive) {
      stop();
      return;
    }
    try {
      await startCamera();
    } catch {
      /* error state set in hook */
    }
  };

  const logToMood = async () => {
    if (!detected?.mood) return;
    setLogStatus("saving");
    try {
      const res = await fetch(`${config.API_URL}/mood/log`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          mood: detected.mood,
          intensity: Math.round((detected.confidence || 0.5) * 10),
          notes: `Face scan: ${detected.label} (${Math.round((detected.confidence || 0) * 100)}%)`,
        }),
      });
      setLogStatus(res.ok ? "ok" : "fail");
      if (res.ok) setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setLogStatus("idle");
      }, 3000);
    } catch {
      setLogStatus("fail");
      setTimeout(() => setLogStatus("idle"), 3000);
    }
  };

  const openChatWithMood = () => {
    if (detected) saveEmotionSession(detected);
    onStartChat?.();
  };

  return (
    <div className="page-section face-scanner pt-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <ScanFace className="w-8 h-8 text-[var(--neon-cyan)]" />
            <h1 className="text-3xl font-bold text-gradient-accent">Face Emotion Scanner</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-2xl">
            Standalone camera tool — detect how you look in real time, save to mood tracker, or bring
            that context into chat. Runs fully in your browser; nothing is uploaded as video.
          </p>
        </motion.div>

        <div className="face-scanner-grid">
          <div className="face-scanner-camera card-web3-panel">
            <div className="face-scanner-video-wrap">
              <video
                ref={videoRef}
                className={`face-scanner-video ${isActive ? "face-scanner-video--live" : ""}`}
                playsInline
                muted
              />
              {!isActive && (
                <div className="face-scanner-placeholder">
                  <ScanFace size={48} className="opacity-40" />
                  <p>Tap start to open your camera</p>
                </div>
              )}
              {isActive && !faceFound && (
                <div className="face-scanner-overlay-hint">Position your face in the frame</div>
              )}
            </div>

            <div className="face-scanner-controls">
              <button
                type="button"
                className={`btn-web3-primary ${isActive ? "btn-web3-primary--outline" : ""}`}
                onClick={handleToggle}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isActive ? (
                  <>
                    <CameraOff size={18} /> Stop camera
                  </>
                ) : (
                  <>
                    <Camera size={18} /> Start camera
                  </>
                )}
              </button>
            </div>

            {error && <p className="face-emotion-error mt-3">{error}</p>}
            {status === "loading" && (
              <p className="text-xs text-[var(--text-muted)] mt-2">Loading AI models… first time may take a few seconds.</p>
            )}
          </div>

          <div className="face-scanner-results card-web3-panel">
            <h2 className="text-lg font-semibold mb-3">Live reading</h2>

            {detected ? (
              <div className="face-scanner-hero-emotion">
                <span className="face-scanner-hero-emoji">{detected.emoji}</span>
                <div>
                  <p className="text-2xl font-bold">{detected.label}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Confidence {Math.round((detected.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                {isActive ? "Analyzing expressions…" : "Start the camera to see your emotion."}
              </p>
            )}

            <div className="face-scanner-bars mt-6 space-y-2">
              {EXPRESSION_ORDER.map((key) => {
                const pct = Math.round((scores?.[key] || 0) * 100);
                const meta = EMOTION_META[key];
                return (
                  <div key={key} className="face-scanner-bar-row">
                    <span className="face-scanner-bar-label">
                      {meta.emoji} {meta.label}
                    </span>
                    <div className="face-scanner-bar-track">
                      <div
                        className="face-scanner-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <span className="face-scanner-bar-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="face-scanner-actions mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-web3-primary btn-web3-primary--sm"
                disabled={!detected || logStatus === "saving"}
                onClick={logToMood}
              >
                <Save size={16} />
                {saved ? "Saved to mood" : "Save to mood tracker"}
              </button>
              <button
                type="button"
                className="btn-web3-primary btn-web3-primary--sm btn-web3-primary--outline"
                disabled={!detected}
                onClick={openChatWithMood}
              >
                <MessageCircle size={16} />
                Chat with this mood
              </button>
            </div>
          </div>
        </div>

        <ul className="face-scanner-tips mt-8 grid sm:grid-cols-3 gap-3">
          {tips.map((tip) => (
            <li key={tip} className="mood-sync-pill text-center text-xs py-3">
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
