'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'kalam';
  timestamp: Date;
}

interface ChatProps {
  onTalkingChange?: (isTalking: boolean) => void;
}

export default function Chat({ onTalkingChange }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Greetings, my young friend. I am here to discuss science, inspiration, and the future of India with you. How can I assist you today?",
      sender: 'kalam',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasSentFirstMessage = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    onTalkingChange?.(true);

    try {
      const isFirstMessage = !hasSentFirstMessage.current;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages, isFirstMessage }),
      });

      const data = await response.json();

      let text = data.text;
      
      // If the API explicitly returns an error message, use it or a better fallback
      if (!text && data.error) {
        text = `My mission encountered a technical difficulty: ${data.details || data.error}. Let us try again with courage.`;
      } else if (!text) {
        text = "I am reflecting on your words. Let us continue our journey of learning.";
      }

      const kalamMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'kalam',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, kalamMessage]);

      // Notify the stats banner that a successful prompt was generated!
      if (isFirstMessage) {
        window.dispatchEvent(new Event('chat-interaction'));
        hasSentFirstMessage.current = true;
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        text: "My communications seem to be offline. Please check your internet connection.",
        sender: 'kalam',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      onTalkingChange?.(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageCircle size={24} color="#3b82f6" style={{ flexShrink: 0 }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', lineHeight: 1.2 }}>Dr. Kalam AI</h2>
            <p style={{ 
              margin: 0, 
              fontSize: '0.65rem', 
              color: 'rgba(251, 191, 36, 0.8)', 
              fontWeight: 500,
              letterSpacing: '0.2px'
            }}>
              Expert Guidance: Prof.CRS KUMAR, DIAT
            </p>
          </div>
        </div>
      </div>
      
      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="message kalam">
            <span className="dot-flashing"></span>
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <input
          type="text"
          className="chat-input"
          placeholder="Ask Dr. Kalam anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-btn" onClick={handleSend} disabled={isLoading}>
          <Send size={18} />
        </button>
      </div>

      <style jsx>{`
        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--accent-primary);
          color: var(--accent-primary);
          animation: dot-flashing 1s infinite linear alternate;
          animation-delay: 0.5s;
          margin-left: 10px;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: "";
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--accent-primary);
          color: var(--accent-primary);
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--accent-primary);
          color: var(--accent-primary);
          animation: dot-flashing 1s infinite alternate;
          animation-delay: 1s;
        }
        @keyframes dot-flashing {
          0% { background-color: var(--accent-primary); }
          50%, 100% { background-color: rgba(59, 130, 246, 0.2); }
        }
      `}</style>
    </div>
  );
}
