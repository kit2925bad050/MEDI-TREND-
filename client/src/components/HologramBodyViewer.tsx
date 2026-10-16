import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Layers } from 'lucide-react';
import hologramBodyImg from '../assets/hologram_body.png';
import { useLanguage } from '../context/LanguageContext';

interface HologramBodyViewerProps {
  compact?: boolean;
  interactive?: boolean;
}

export const HologramBodyViewer: React.FC<HologramBodyViewerProps> = ({
  compact = false,
  interactive = true,
}) => {
  const { dict } = useLanguage();
  const [activeMode, setActiveMode] = useState<'hologram' | 'cardiac_focus'>('hologram');
  const [heartRate] = useState<number>(68); // 68 BPM = ~0.88s cardiac cycle
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-precision ambient volumetric medical particle engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];

    // Initialize subtle medical cyan/magenta holographic particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.4 + 0.4,
        speedY: -(Math.random() * 0.3 + 0.1),
        opacity: Math.random() * 0.4 + 0.15,
        color: Math.random() > 0.5 ? '#00f2fe' : '#ff2a8d',
      });
    }

    let scanLineY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle medical scanline
      scanLineY = (scanLineY + 0.65) % height;
      const grad = ctx.createLinearGradient(0, scanLineY - 12, 0, scanLineY + 12);
      grad.addColorStop(0, 'rgba(0, 242, 254, 0)');
      grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.05)');
      grad.addColorStop(1, 'rgba(0, 242, 254, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanLineY - 12, width, 24);

      // Draw subtle floating particles
      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 3;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className={`relative select-none overflow-hidden rounded-2xl transition-all duration-500 ${
        compact
          ? 'bg-gradient-to-b from-[#060e22] via-[#091535] to-[#040817] p-3 text-white'
          : 'bg-gradient-to-b from-[#050b1a] via-[#081533] to-[#030612] p-5 text-white shadow-2xl border border-cyan-500/20'
      }`}
    >
      {/* Background Holographic Medical Grid */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 45%, rgba(0, 242, 254, 0.4) 0%, transparent 65%),
            linear-gradient(to right, rgba(0, 242, 254, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 242, 254, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 18px 18px, 18px 18px',
        }}
      />

      {/* Canvas Layer for Ambient Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Header Info (if not compact) */}
      {!compact && (
        <div className="relative z-20 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-semibold tracking-wider text-cyan-300 uppercase">
              {dict.hologram_title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono">
            <Activity className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
            <span>{heartRate} {dict.hologram_bpm_normal}</span>
          </div>
        </div>
      )}

      {/* Main Anatomical Visualization Container */}
      <div className="relative w-full flex items-center justify-center py-1">
        {/* Soft Volumetric Background Cone Glow */}
        <div className="absolute inset-x-8 bottom-0 h-24 bg-gradient-to-t from-cyan-500/15 via-blue-500/10 to-transparent blur-xl pointer-events-none" />

        {/* Anatomical Model Image Wrapper with Natural Cardiac Systole/Diastole Motion */}
        <div className="relative w-full max-w-[270px] sm:max-w-[310px] aspect-[1/1.45] flex items-center justify-center overflow-hidden rounded-xl">
          {/* Base Photorealistic Medical Image */}
          <motion.img
            src={hologramBodyImg}
            alt="Photorealistic Medical Anatomical Model"
            className="w-full h-full object-contain filter drop-shadow-[0_0_16px_rgba(0,242,254,0.3)] select-none"
            style={{
              mixBlendMode: 'screen',
            }}
            animate={{
              // Natural, subtle thoracic breathing and cardiac rhythmic expansion
              scale: [1, 1.018, 1.006, 1.014, 1],
            }}
            transition={{
              duration: 0.88, // ~68 BPM cardiac cycle
              repeat: Infinity,
              times: [0, 0.16, 0.32, 0.46, 1],
              ease: 'easeInOut',
            }}
          />

          {/* SVG Overlay: REALISTIC CORONARY VASODILATION & MYOCARDIAL LUMINESCENCE (NO CARTOON SHAPES) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 400 580"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Soft Subsurface Scattering Radial Glow for Myocardium */}
              <radialGradient id="myocardialGlow" cx="54%" cy="47%" r="28%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#ff1493" stopOpacity="0.65" />
                <stop offset="60%" stopColor="#ff007f" stopOpacity="0.35" />
                <stop offset="85%" stopColor="#00f2fe" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
              </radialGradient>

              {/* Coronary Vessel Wave Gradient */}
              <linearGradient id="coronaryPulse" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#ff1493" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.2" />
              </linearGradient>

              <filter id="softBioGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Myocardial Bioluminescent Subsurface Contraction Aura (Centered precisely at anatomical heart) */}
            <g transform="translate(216, 270)">
              <motion.circle
                cx="0"
                cy="0"
                r="36"
                fill="url(#myocardialGlow)"
                filter="url(#softBioGlow)"
                animate={{
                  scale: [1, 1.28, 1.05, 1.20, 1],
                  opacity: [0.3, 0.95, 0.45, 0.85, 0.3],
                }}
                transition={{
                  duration: 0.88,
                  repeat: Infinity,
                  times: [0, 0.16, 0.32, 0.46, 1],
                  ease: 'easeInOut',
                }}
              />
            </g>

            {/* 2. Soft Coronary Light Wave Propagation (Following actual aortic & carotid paths) */}
            <g opacity="0.85">
              {/* Ascending Aorta & Carotid Wave */}
              <motion.path
                d="M 216 260 Q 212 210 208 160 Q 206 120 204 80"
                fill="none"
                stroke="#ff1493"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="14 140"
                animate={{
                  strokeDashoffset: [154, 0],
                  opacity: [0.2, 0.9, 0.2],
                }}
                transition={{
                  duration: 0.88,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />

              {/* Descending Aorta to Femoral Path */}
              <motion.path
                d="M 216 280 L 214 360 Q 212 430 200 520"
                fill="none"
                stroke="#00f2fe"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="18 180"
                animate={{
                  strokeDashoffset: [198, 0],
                  opacity: [0.25, 0.85, 0.25],
                }}
                transition={{
                  duration: 0.88,
                  delay: 0.1,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            </g>
          </svg>
        </div>
      </div>

      {/* Synchronized Electrocardiogram (ECG) Rhythm */}
      <div className="relative z-20 mt-1 px-1">
        <div className="flex items-center justify-between text-[11px] text-cyan-400/80 mb-1 font-mono">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            {dict.hologram_ecg_lead}
          </span>
          <span className="text-pink-400">{dict.hologram_ecg_normal}</span>
        </div>

        {/* ECG SVG Waveform */}
        <div className="w-full h-8 rounded-lg bg-black/40 border border-cyan-500/20 overflow-hidden relative flex items-center">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'linear-gradient(to right, #00f2fe 1px, transparent 1px), linear-gradient(to bottom, #00f2fe 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />

          <svg className="w-full h-full" viewBox="0 0 300 40" preserveAspectRatio="none">
            <motion.path
              d="M 0 20 L 30 20 L 38 18 L 44 22 L 50 20 L 65 20 L 72 23 L 78 5 L 84 35 L 90 14 L 96 20 L 115 20 L 125 15 L 135 20 L 160 20 L 168 18 L 174 22 L 180 20 L 195 20 L 202 23 L 208 5 L 214 35 L 220 14 L 226 20 L 245 20 L 255 15 L 265 20 L 300 20"
              fill="none"
              stroke="#00f2fe"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 5px #00f2fe)"
              initial={{ strokeDasharray: 300, strokeDashoffset: 300 }}
              animate={{
                strokeDashoffset: [300, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </svg>

          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#00f2fe]"
            animate={{
              left: ['0%', '100%'],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};
