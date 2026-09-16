import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Mic, MicOff, Volume2, VolumeX, X, Sparkles } from "lucide-react";
import config, { getAuthHeaders } from "../config";
import { speakText, stopSpeech, initializeSpeechRecognition } from "../utils/voiceUtils";
import FaceEmotionCapture from "./FaceEmotionCapture";
import { loadEmotionSession } from "../utils/faceEmotion";

const CHAT_STORAGE_KEY = "braino_chat";

const INITIAL_MESSAGE = {
  id: 1,
  text: "Hi 😊 I'm Braino AI. How are you feeling today?",
  sender: "bot",
};

const defaultMessages = () => [INITIAL_MESSAGE];

export default function ChatInterface({ onClose, onOpenEmotionScanner }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultMessages();
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [emotionCamOn, setEmotionCamOn] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [sessionEmotion] = useState(() => loadEmotionSession());

  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      recognitionRef.current = initializeSpeechRecognition(
        (res) => {
          if (res.isFinal) {
            setInputText(res.transcript);
            setIsListening(false);
          }
        },
        () => setIsListening(false)
      );
    }
  }, []);

  const handleEmotionChange = useCallback((emotion) => {
    setDetectedEmotion(emotion);
  }, []);

  const handleClose = () => {
    stopSpeech();
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setMessages(defaultMessages());
    setEmotionCamOn(false);
    setDetectedEmotion(null);
    onClose();
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setInputText("");
    }
  };

  const sendMessage = async (textOverride = null) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { id: Date.now(), text, sender: "user" }]);
    setInputText("");
    setIsLoading(true);
    stopSpeech();

    const payload = { message: text };
    const emotionForSend = detectedEmotion || sessionEmotion;
    if (emotionForSend?.expression) {
      payload.emotion = emotionForSend.expression;
      payload.emotion_confidence = emotionForSend.confidence;
    }

    try {
      const res = await fetch(`${config.API_URL}/chat/`, {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: data.response, sender: "bot" }]);
      if (isVoiceEnabled) speakText(data.response);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now(), text: "Server error ❌", sender: "bot" }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="chat-web3-overlay">
      <div className="chat-web3-panel">
        <div className="chat-web3-header">
          <div className="flex gap-2 items-center flex-wrap">
            <Sparkles className="text-[var(--neon-cyan)]" size={22} />
            <h2 className="font-bold text-lg">
              Braino<span className="text-neon-cyan">AI</span>
            </h2>
            <span className="web3-badge-sm">Live</span>
            <FaceEmotionCapture
              enabled={emotionCamOn}
              onToggle={setEmotionCamOn}
              onEmotionChange={handleEmotionChange}
              onOpenScanner={onOpenEmotionScanner}
            />
          </div>
          <button type="button" onClick={handleClose} className="nav-web3__link p-2" aria-label="Close chat">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {(detectedEmotion && emotionCamOn) || sessionEmotion ? (
            <p className="text-xs text-center text-[var(--text-muted)] opacity-80">
              Mood context:{" "}
              {(detectedEmotion || sessionEmotion).emoji}{" "}
              {(detectedEmotion || sessionEmotion).label}
              {sessionEmotion && !emotionCamOn ? " (from Face Scanner)" : ""}
              {" — "}
              <button
                type="button"
                className="underline text-[var(--neon-cyan)]"
                onClick={onOpenEmotionScanner}
              >
                open full scanner
              </button>
            </p>
          ) : null}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                  msg.sender === "user" ? "chat-web3-bubble-user" : "chat-web3-bubble-bot"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-1.5 pl-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--neon-cyan)] animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t border-[var(--border-dim)] flex gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "🎤 Listening..." : "Message Braino AI..."}
            className="chat-web3-input"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button type="button" onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className="nav-web3__link p-3">
            {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button type="button" onClick={toggleListening} className="nav-web3__link p-3">
            {isListening ? <Mic size={20} className="text-[var(--neon-cyan)]" /> : <MicOff size={20} />}
          </button>
          <button type="button" onClick={() => sendMessage()} className="btn-web3-primary btn-web3-primary--sm p-3">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
