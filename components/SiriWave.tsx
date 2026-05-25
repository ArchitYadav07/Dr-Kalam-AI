'use client';

import React, { useEffect, useRef } from 'react';

interface SiriWaveProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioVolume: number; // Real-time volume input (0.0 to 1.0)
}

export default function SiriWave({ status, audioVolume }: SiriWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const currentVolumeRef = useRef(0.1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Multi-layered Siri Wave configuration
    const WAVES = [
      { amplitude: 1.0, frequency: 1.5, color: 'rgba(59, 130, 246, 0.85)', speed: 0.08 }, // Electric Blue
      { amplitude: 0.6, frequency: 2.5, color: 'rgba(236, 72, 153, 0.6)', speed: -0.12 }, // Glowing Magenta
      { amplitude: 0.8, frequency: 2.0, color: 'rgba(251, 191, 36, 0.45)', speed: 0.06 }, // Warm Yellow/Orange
      { amplitude: 0.4, frequency: 3.5, color: 'rgba(255, 255, 255, 0.35)', speed: -0.16 } // Soft White
    ];

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, width, height);

      // Lerp volume for ultra smooth transitions
      let targetVolume = 0.05; // Base tiny pulse when idle
      
      if (status === 'listening' || status === 'speaking') {
        // Boost user speech or Kalam speech peaks
        targetVolume = 0.08 + audioVolume * 0.92;
      } else if (status === 'thinking') {
        // Slow pulsing breathing effect during inference
        targetVolume = 0.2 + 0.1 * Math.sin(Date.now() * 0.006);
      } else {
        // Idle breathing
        targetVolume = 0.04 + 0.015 * Math.sin(Date.now() * 0.002);
      }

      currentVolumeRef.current += (targetVolume - currentVolumeRef.current) * 0.15; // Smooth LERP
      const vol = currentVolumeRef.current;

      phaseRef.current += 0.05;
      const phase = phaseRef.current;

      // Draw beautiful layered organic waves
      WAVES.forEach((wave) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = status === 'thinking' ? 2.5 : 2.0;
        ctx.globalCompositeOperation = 'screen'; // Beautiful blend mode

        // Smooth glow shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = wave.color;

        for (let x = 0; x < width; x++) {
          // Normalize x coordinate for trigonometric calculation
          const normalizedX = (x / width) * Math.PI * 2 * wave.frequency;
          
          // Apply a sine wave multiplied by a standard bell curve (so edges pinch down gracefully to 0)
          const envelope = Math.sin((x / width) * Math.PI); // Pinches edges to 0
          const y = Math.sin(normalizedX + phase * wave.speed) * wave.amplitude * vol * (height * 0.35) * envelope + (height / 2);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [status, audioVolume]);

  return (
    <div className="siri-wave-wrapper">
      <canvas ref={canvasRef} className="siri-wave-canvas" />
      <style jsx>{`
        .siri-wave-wrapper {
          width: 100%;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin: 1rem 0;
          overflow: hidden;
        }
        .siri-wave-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
      `}</style>
    </div>
  );
}
