'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export interface MadeleLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { box: 28, logo: 20, ring: 30, stroke: 2 },
  sm: { box: 44, logo: 30, ring: 48, stroke: 2.5 },
  md: { box: 68, logo: 46, ring: 74, stroke: 3 },
  lg: { box: 96, logo: 66, ring: 104, stroke: 3.5 },
  xl: { box: 130, logo: 90, ring: 140, stroke: 4 },
};

export function MadeleLoader({
  size = 'md',
  text,
  subtext,
  fullScreen = false,
  className = '',
}: MadeleLoaderProps) {
  const config = sizeMap[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 select-none ${className}`}>
      {/* Animated Brand Emblem Container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: config.ring, height: config.ring }}
      >
        {/* Soft Ambient Glow */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0066B3]/25 via-sky-400/20 to-amber-400/25 blur-lg pointer-events-none animate-pulse"
          style={{ transform: 'scale(1.25)' }}
        />

        {/* Orbiting Electric SVG Rings */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '2.4s', animationTimingFunction: 'linear' }}
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Subtle Track Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="currentColor"
            strokeWidth={config.stroke * 1.2}
            className="text-sky-200/50 dark:text-sky-900/30"
          />

          {/* Electric Blue Primary Arc */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#0066B3"
            strokeWidth={config.stroke * 1.5}
            strokeDasharray="160 120"
            strokeLinecap="round"
          />

          {/* Amber Accent Spark Arc */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#F59E0B"
            strokeWidth={config.stroke * 1.8}
            strokeDasharray="45 235"
            strokeDashoffset="-90"
            strokeLinecap="round"
          />
        </svg>

        {/* Counter-rotating subtle dashed ring */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{
            animationDuration: '4.8s',
            animationDirection: 'reverse',
            animationTimingFunction: 'linear',
            transform: 'scale(0.85)',
          }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#38BDF8"
            strokeWidth={config.stroke}
            strokeDasharray="20 40"
            strokeLinecap="round"
            opacity={0.6}
          />
        </svg>

        {/* Central Logo with subtle energy pulse */}
        <motion.div
          animate={{
            scale: [0.95, 1.05, 0.95],
            filter: [
              'drop-shadow(0 0 4px rgba(0, 102, 179, 0.25))',
              'drop-shadow(0 0 10px rgba(245, 158, 11, 0.45))',
              'drop-shadow(0 0 4px rgba(0, 102, 179, 0.25))',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 flex items-center justify-center shrink-0"
          style={{ width: config.logo, height: config.logo }}
        >
          <Image
            src="/logo.png"
            alt="MADELES Logo"
            width={config.logo}
            height={config.logo}
            className="object-contain select-none pointer-events-none"
            priority
          />
        </motion.div>
      </div>

      {/* Optional Status Typography */}
      {(text || subtext) && (
        <div className="text-center space-y-0.5">
          {text && (
            <p className="text-xs font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
              <span>{text}</span>
            </p>
          )}
          {subtext && <p className="text-[11px] text-slate-400 font-medium">{subtext}</p>}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white/95 rounded-3xl p-8 shadow-2xl border border-slate-200/80 max-w-sm w-full mx-auto flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export function MadeleSpinner({
  size = 'xs',
  className = '',
}: {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  return <MadeleLoader size={size} className={className} />;
}

export default MadeleLoader;
