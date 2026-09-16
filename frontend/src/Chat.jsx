import { useState, useRef, useEffect } from "react";
import config from "./config";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${config.API_URL}/chat/`, {
        method: "POST",
          headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-8).map((message) => ({
            role: message.sender === "user" ? "user" : "assistant",
            content: message.text,
          })),
        }),
      });

      const data = await res.json();

      const botMsg = { text: data.response, sender: "bot" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { text: "Server error ❌", sender: "bot" },
      ]);
    }

    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      
      <div className="bg-blue-600 text-white p-4 text-center text-xl font-bold shadow">
        Braino AI Chat
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap max-w-xs px-4 py-2 rounded-xl shadow ${
              msg.sender === "user"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-white text-black"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      <div className="p-4 bg-white flex gap-2 border-t">
        <input
          className="flex-1 border rounded-lg px-4 py-2 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
