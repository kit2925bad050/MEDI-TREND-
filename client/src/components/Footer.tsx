import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { dict } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subtle floating background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 60);

    const dots: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 18; i++) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.25 + 0.1),
        size: Math.random() * 1.2 + 0.4,
        opacity: Math.random() * 0.4 + 0.15,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      dots.forEach((dot) => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.y < 0) {
          dot.y = height;
          dot.x = Math.random() * width;
        }
        if (dot.x < 0) dot.x = width;
        if (dot.x > width) dot.x = 0;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fillStyle = '#00f2fe';
        ctx.globalAlpha = dot.opacity;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <footer className="relative mt-8 select-none overflow-hidden bg-slate-900/90 dark:bg-[#060c1d]/95 backdrop-blur-md border-t border-cyan-500/20 text-slate-400 py-4 px-6 transition-colors duration-200">
      {/* Background Canvas for Gentle Particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Top Animated Traveling Light Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] overflow-hidden pointer-events-none z-10">
        <motion.div
          className="h-full w-48 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#00f2fe]"
          animate={{
            x: ['-200px', '1800px'],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content Row */}
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Platform Certification & Compliance */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 dark:bg-slate-900/90 border border-slate-700/80 dark:border-cyan-500/20">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-cyan-300/90">{dict.hipaa_compliant}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 dark:bg-slate-900/90 border border-slate-700/80 dark:border-cyan-500/20">
            <Lock className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-mono text-slate-300">{dict.ssl_encrypted}</span>
          </div>
        </div>

        {/* Center / Right: Signature Brand Text with Futuristic Glow */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{dict.developed_by}</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="group relative font-extrabold tracking-wider text-cyan-300 cursor-pointer transition-all duration-300"
          >
            <span className="relative z-10 bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,242,254,0.55)] group-hover:drop-shadow-[0_0_18px_rgba(0,242,254,0.9)]">
              SC TECH
            </span>
            <span className="absolute inset-0 bg-cyan-400/20 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.span>
          <span className="text-slate-400 font-semibold">© 2026</span>
        </div>

        {/* Right Status */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{dict.system_online}</span>
        </div>
      </div>
    </footer>
  );
};
