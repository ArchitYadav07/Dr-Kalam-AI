'use client';

import React, { useEffect, useState } from 'react';
import { Users, Calendar, Activity } from 'lucide-react';

export default function StatsBanner() {
  const [stats, setStats] = useState({ 
      sessions: { total: 0, thisWeek: 0, today: 0 },
      prompts: { total: 0, thisWeek: 0, today: 0 }
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          sessions: data.sessions || { total: 0, thisWeek: 0, today: 0 },
          prompts: data.prompts || { total: 0, thisWeek: 0, today: 0 }
        });
      }
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    window.addEventListener('chat-interaction', fetchStats);

    return () => {
      clearInterval(interval);
      window.removeEventListener('chat-interaction', fetchStats);
    };
  }, []);

  return (
    <div className="stats-banner">
      <div className="stats-row">
        <div className="stat-item">
          <Users size={14} className="stat-icon" />
          <span className="stat-label">Unique Users:</span>
          <span className="stat-value">{stats.sessions.total}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <Calendar size={14} className="stat-icon" />
          <span className="stat-label">This Week:</span>
          <span className="stat-value">{stats.sessions.thisWeek}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <Activity size={14} className="stat-icon" />
          <span className="stat-label">Today:</span>
          <span className="stat-value">{stats.sessions.today}</span>
        </div>
      </div>
      
      <div className="stats-row prompts-row">
        <div className="stat-item">
          <span className="stat-label prompts-label">Prompts Generated:</span>
          <span className="stat-value">{stats.prompts.total}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-label">This Week:</span>
          <span className="stat-value">{stats.prompts.thisWeek}</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-label">Today:</span>
          <span className="stat-value">{stats.prompts.today}</span>
        </div>
      </div>

      <style jsx>{`
        .stats-banner {
          position: absolute;
          top: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          pointer-events: auto;
          white-space: nowrap;
        }
        .stats-row {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.5rem 1rem;
          border-radius: 99px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.75rem;
          font-weight: 500;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .prompts-row {
          padding: 0.3rem 0.8rem;
          font-size: 0.65rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .stat-divider {
          width: 1px;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
        }
        .stat-icon {
          color: #3b82f6;
        }
        .stat-label {
          opacity: 0.7;
          display: none;
        }
        .prompts-label {
          color: #10b981; /* Green accent for generated prompts */
          opacity: 0.9;
        }
        .stat-value {
          font-weight: 700;
          color: #fff;
        }

        @media (min-width: 600px) {
          .stat-label {
            display: inline;
          }
        }
        @media (max-width: 400px) {
          .stats-row {
            gap: 0.5rem;
            padding: 0.4rem 0.8rem;
            font-size: 0.7rem;
          }
          .prompts-row {
            font-size: 0.6rem;
            padding: 0.2rem 0.6rem;
          }
          .stats-banner {
            top: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
