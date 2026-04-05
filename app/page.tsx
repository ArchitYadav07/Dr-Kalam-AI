'use client';

import React, { useState, useEffect } from 'react';
import AvatarScene from '@/components/Avatar';
import Chat from '@/components/Chat';
import { useProgress } from '@react-three/drei';

function LoadingOverlay() {
  const { progress } = useProgress();
  const [show, setShow] = useState(true);
  const [internalProgress, setInternalProgress] = useState(0);

  // Sync internal progress safely after render
  useEffect(() => {
    setInternalProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (internalProgress === 100) {
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [internalProgress]);

  if (!show) return null;

  return (
    <div className={`loading-overlay ${internalProgress === 100 ? 'fade-out' : ''}`}>
      <div className="loader-content">
        <div className="loader-percentage">{Math.round(internalProgress)}%</div>
        <div className="loader-text">Engaging Dr. Kalam...</div>
        <div className="loader-bar">
          <div className="loader-fill" style={{ width: `${internalProgress}%` }}></div>
        </div>
      </div>
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: #050508;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: opacity 0.8s ease-out;
        }
        .fade-out {
          opacity: 0;
          pointer-events: none;
        }
        .loader-content {
          text-align: center;
        }
        .loader-percentage {
          font-size: 3rem;
          font-weight: 700;
          color: white;
          font-family: var(--font-heading);
          margin-bottom: 0.5rem;
        }
        .loader-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 2rem;
        }
        .loader-bar {
          width: 200px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin: 0 auto;
        }
        .loader-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease-out;
          box-shadow: 0 0 10px #3b82f6;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const [isTalking, setIsTalking] = useState(false);

  return (
    <main className="main-container">
      {/* Decoupled Loading UI */}
      <LoadingOverlay />

      {/* 3D Avatar Background */}
      <AvatarScene isTalking={isTalking} />

      {/* UI Overlay */}
      <div className="ui-layer">
        <div className="title-card">
          <span className="badge">Vision 2026</span>
          <h1>Dr. <span className="title-highlight">Kalam</span> AI</h1>
          <p className="subtitle">Inspiring the minds of tomorrow through the wisdom of today.</p>
          <p className="subtitle-quote">"Dream is not that which you see while sleeping, it is something that does not let you sleep."</p>
        </div>

        {/* Chat Interface */}
        <Chat onTalkingChange={setIsTalking} />

        {/* Footer */}
        <div className="footer-credit">
          <span className="footer-line"></span>
          <p>Developed with ❤️ by <strong>Archit</strong></p>
        </div>
      </div>
    </main>
  );
}
