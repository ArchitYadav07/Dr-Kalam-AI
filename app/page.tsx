'use client';

import React, { useState, useEffect } from 'react';
import AvatarScene from '@/components/Avatar';
import Chat from '@/components/Chat';
import StatsBanner from '@/components/StatsBanner';
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

const FeedbackButton = () => (
  <a 
    href="https://docs.google.com/forms/d/e/1FAIpQLSd8PRWm-Vyn4Accn_DIc1hhE4g1_7yI7o6DlE8wAdWSwyrYFA/viewform?usp=publish-editor" 
    target="_blank" 
    rel="noopener noreferrer"
    className="footer-feedback-btn"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    Feedback
  </a>
);

export default function Home() {
  const [isTalking, setIsTalking] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const chatSectionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prevent catastrophic React Hydration Mismatch on mobile
  if (isMobile === null) {
    return <div style={{ width: '100vw', height: '100vh', background: '#050508' }}></div>;
  }

  // Mobile: vertical scroll layout
  if (isMobile) {
    return (
      <div className="mobile-scroll-container">
        <LoadingOverlay />
        <StatsBanner />

        {/* Section 1: Full-screen 3D Model */}
        <section className="mobile-model-section">
          <AvatarScene isTalking={isTalking} />
          <div className="mobile-title-overlay">
            <span className="badge">Vision 2026</span>
            <h1>Dr. <span className="title-highlight">Kalam</span> AI</h1>
            <p className="subtitle">Inspiring the minds of tomorrow.</p>
          </div>
          
          {/* Action Button - moved to bottom */}
          <div className="mobile-action-button" onClick={scrollToChat}>
            <button className="glass-btn">
              Chat with Dr. Kalam
            </button>
          </div>

          <div className="scroll-indicator" onClick={scrollToChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* Section 2: Chat */}
        <section className="mobile-chat-section" ref={chatSectionRef}>
          <div className="chat-section-header">
            <button className="back-to-model-pill" onClick={scrollToTop}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                 <path d="M18 15l-6-6-6 6" />
               </svg>
               Back to Model
            </button>
          </div>

          <Chat onTalkingChange={setIsTalking} />
          
          <div className="mobile-footer">
            <p>
              Created by <a href="https://archityadav.netlify.app/" target="_blank" rel="noopener noreferrer" className="footer-link">Archit Yadav</a> in collaboration with <a href="https://www.novatechrobo.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Novatech Robo Pvt Ltd</a>
            </p>
            <div className="mobile-feedback-wrapper">
              <FeedbackButton />
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Desktop: overlay layout (unchanged)
  return (
    <main className="main-container">
      <LoadingOverlay />
      <StatsBanner />
      <AvatarScene isTalking={isTalking} />

      <div className="ui-layer">
        <div className="title-card">
          <span className="badge">Vision 2026</span>
          <h1>Dr. <span className="title-highlight">Kalam</span> AI</h1>
          <p className="subtitle">Inspiring the minds of tomorrow through the wisdom of today.</p>
          <p className="subtitle-quote">"Dream is not that which you see while sleeping, it is something that does not let you sleep."</p>
        </div>

        <Chat onTalkingChange={setIsTalking} />

        <div className="footer-credit">
          <span className="footer-line"></span>
          <p>
            Created by <a href="https://archityadav.netlify.app/" target="_blank" rel="noopener noreferrer" className="footer-link">Archit Yadav</a> in collaboration with <a href="https://www.novatechrobo.com/" target="_blank" rel="noopener noreferrer" className="footer-link">Novatech Robo Pvt Ltd</a>
          </p>
          <FeedbackButton />
        </div>
      </div>
    </main>
  );
}


