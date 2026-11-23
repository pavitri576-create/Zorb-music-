import React, { useEffect, useMemo, useRef } from 'react';

interface SplashScreenProps {
  accentHex: string;
  onComplete: () => void;
}

interface SonicColumn {
  id: number;
  xStartPct: number;
  spreadDir: number;
  widthPx: number;
  heightPct: number;
  tone: 'accent' | 'white' | 'deep';
  maxOpacity: number;
  delayNorm: number;
  blurPx: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(t: number): number {
  const x = clamp01(t);
  return x * x * x;
}

function easeInOutQuart(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

/**
 * 100% Silent, ZORB-Original Cinema Opening (~3.10s)
 * Same flagship pacing, camera push-through, and zoom-dissolve quality —
 * crafted in ZORB's signature identity:
 * - Hollow black + theme-outline geometric "Z" emblem (matching ZORB Hoodie/Cap outline DNA)
 * - Symmetrical Sonic Equalizer light columns in ZORB's theme + crisp white (no rainbow copy)
 * - Outline "ZORB" + "Z = M × D²" wordmark lockup -> seamless zoom-dissolve into Home
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ accentHex, onComplete }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const zStageRef = useRef<HTMLDivElement | null>(null);
  const zOutlinePathRef = useRef<SVGPathElement | null>(null);
  const zInnerBevelRef = useRef<SVGPathElement | null>(null);
  const zFillPathRef = useRef<SVGPathElement | null>(null);
  const zDiagSlashRef = useRef<SVGLineElement | null>(null);
  const zGlowRef = useRef<HTMLDivElement | null>(null);
  const spectrumWrapRef = useRef<HTMLDivElement | null>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);
  const glintRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Symmetrical stereo sonic light columns strictly in ZORB palette (accent + white + deep shadow)
  const columns = useMemo<SonicColumn[]>(() => {
    const pairs = 15; // 30 symmetrical columns
    const list: SonicColumn[] = [];
    for (let i = 0; i < pairs; i++) {
      const norm = i / (pairs - 1); // 0 (center) -> 1 (outer)
      const heightPct = 92 - norm * 32 + (i % 3) * 6;
      const tone: SonicColumn['tone'] =
        i % 4 === 0 ? 'white' : i % 3 === 0 ? 'deep' : 'accent';
      const widthPx = i % 5 === 0 ? 10 : i % 2 === 0 ? 4 : 2;
      const maxOpacity = tone === 'white' ? 0.85 : tone === 'accent' ? 0.9 : 0.55;
      const blurPx = i % 6 === 0 ? 2 : 0;

      [-1, 1].forEach((side, sideIdx) => {
        list.push({
          id: i * 2 + sideIdx,
          xStartPct: side * (1.2 + norm * 18),
          spreadDir: side * (1.35 + norm * 2.85),
          widthPx,
          heightPct,
          tone,
          maxOpacity,
          delayNorm: (i % 5) * 0.035,
          blurPx,
        });
      });
    }
    return list;
  }, []);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      const timer = window.setTimeout(() => onCompleteRef.current(), 650);
      return () => window.clearTimeout(timer);
    }

    const TOTAL_MS = 3100;
    const start = performance.now();
    let rafId = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      onCompleteRef.current();
    };

    const zPathLength = zOutlinePathRef.current?.getTotalLength?.() || 920;
    if (zOutlinePathRef.current) {
      zOutlinePathRef.current.style.strokeDasharray = `${zPathLength}`;
      zOutlinePathRef.current.style.strokeDashoffset = `${zPathLength}`;
    }

    const tick = (now: number) => {
      const elapsedMs = now - start;
      const t = elapsedMs / 1000;

      // -----------------------------------------------------------
      // PHASE 1 (0.00s - 0.86s): ZORB Outline Geometric "Z" Trace
      // -----------------------------------------------------------
      const drawP = easeInOutQuart((t - 0.04) / 0.56);
      if (zOutlinePathRef.current) {
        zOutlinePathRef.current.style.strokeDashoffset = `${(zPathLength * (1 - drawP)).toFixed(2)}`;
      }
      if (zInnerBevelRef.current) {
        zInnerBevelRef.current.style.opacity = `${(easeOutCubic((t - 0.42) / 0.32) * 0.7).toFixed(3)}`;
      }
      if (zFillPathRef.current) {
        zFillPathRef.current.style.opacity = `${easeOutCubic((t - 0.32) / 0.35).toFixed(3)}`;
      }
      if (zDiagSlashRef.current) {
        const slashP = easeOutCubic((t - 0.52) / 0.28);
        zDiagSlashRef.current.style.opacity = `${(slashP * 0.85).toFixed(3)}`;
        zDiagSlashRef.current.style.transform = `scaleY(${slashP.toFixed(3)})`;
      }

      // -----------------------------------------------------------
      // PHASE 2 (0.86s - 1.56s): Camera Dive Through the Hollow "Z"
      // -----------------------------------------------------------
      if (zStageRef.current) {
        if (t < 0.86) {
          const settle = 0.94 + 0.06 * easeOutCubic(t / 0.86);
          zStageRef.current.style.transform = `scale(${settle.toFixed(4)})`;
          zStageRef.current.style.opacity = '1';
        } else {
          const diveP = easeInCubic((t - 0.86) / 0.62);
          const scale = 1 + diveP * 4.8;
          const opacity = clamp01(1 - easeOutCubic((t - 0.98) / 0.42));
          zStageRef.current.style.transform = `scale(${scale.toFixed(4)})`;
          zStageRef.current.style.opacity = `${opacity.toFixed(4)}`;
        }
      }

      if (zGlowRef.current) {
        const gIn = easeOutCubic((t - 0.2) / 0.55);
        const gOut = t > 0.92 ? clamp01(1 - (t - 0.92) / 0.55) : 1;
        zGlowRef.current.style.opacity = `${(gIn * gOut * 0.52).toFixed(3)}`;
      }

      // -----------------------------------------------------------
      // PHASE 2B (0.88s - 2.10s): Symmetrical Sonic Light Columns
      // -----------------------------------------------------------
      if (spectrumWrapRef.current) {
        const specIn = easeOutCubic((t - 0.88) / 0.22);
        const specOut = t > 1.66 ? clamp01(1 - easeInCubic((t - 1.66) / 0.44)) : 1;
        spectrumWrapRef.current.style.opacity = `${(specIn * specOut).toFixed(4)}`;

        const travelP = easeInOutQuart((t - 0.88) / 1.22);
        for (let i = 0; i < columns.length; i++) {
          const el = colRefs.current[i];
          if (!el) continue;
          const c = columns[i];
          const localP = clamp01((travelP - c.delayNorm) / (1 - c.delayNorm));
          const xVw = c.xStartPct + c.spreadDir * localP * 40;
          const scaleX = 1 + localP * 1.4;
          const scaleY = 0.55 + localP * 0.85;
          el.style.transform = `translate3d(${xVw.toFixed(2)}vw, 0, 0) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`;
          el.style.opacity = `${(c.maxOpacity * clamp01(localP * 3.2)).toFixed(3)}`;
        }
      }

      // -----------------------------------------------------------
      // PHASE 3 (1.72s - 2.74s): ZORB Signature Outline Wordmark
      // -----------------------------------------------------------
      if (wordmarkRef.current) {
        if (t < 1.72) {
          wordmarkRef.current.style.opacity = '0';
          wordmarkRef.current.style.transform = 'scale(0.92)';
        } else {
          const wIn = easeOutCubic((t - 1.72) / 0.40);
          const wScale = 0.92 + wIn * 0.08;
          wordmarkRef.current.style.opacity = `${wIn.toFixed(4)}`;
          wordmarkRef.current.style.transform = `scale(${wScale.toFixed(4)})`;
        }
      }

      if (glintRef.current) {
        if (t >= 1.92 && t <= 2.55) {
          const gP = easeInOutQuart((t - 1.92) / 0.55);
          glintRef.current.style.opacity = `${Math.sin(gP * Math.PI).toFixed(3)}`;
          glintRef.current.style.transform = `translate3d(${(-110 + gP * 220).toFixed(1)}%, 0, 0) skewX(-20deg)`;
        } else {
          glintRef.current.style.opacity = '0';
        }
      }

      if (subtitleRef.current) {
        const sIn = easeOutCubic((t - 1.94) / 0.34);
        subtitleRef.current.style.opacity = `${sIn.toFixed(4)}`;
        subtitleRef.current.style.transform = `translate3d(0, ${(1 - sIn) * 8}px, 0)`;
      }

      // -----------------------------------------------------------
      // PHASE 4 (2.72s - 3.10s): Seamless Cinema Zoom-Dissolve
      // -----------------------------------------------------------
      if (rootRef.current) {
        if (t > 2.72) {
          const outP = easeInCubic((t - 2.72) / 0.38);
          rootRef.current.style.opacity = `${clamp01(1 - outP).toFixed(4)}`;
          rootRef.current.style.transform = `scale(${(1 + outP * 0.065).toFixed(4)})`;
        } else {
          rootRef.current.style.opacity = '1';
          rootRef.current.style.transform = 'scale(1)';
        }
      }

      if (elapsedMs >= TOTAL_MS) {
        finish();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [columns]);

  return (
    <div
      ref={rootRef}
      onClick={() => onCompleteRef.current()}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none will-change-transform cursor-pointer"
      aria-label="ZORB splash intro"
    >
      {/* Subtle Theme Accent Ambient Glow */}
      <div
        ref={zGlowRef}
        className="pointer-events-none absolute w-[360px] h-[360px] rounded-full opacity-0"
        style={{
          background: `radial-gradient(circle, ${accentHex}38 0%, ${accentHex}10 45%, transparent 72%)`,
          filter: 'blur(34px)',
        }}
      />

      {/* Stage 1 & 2: ZORB Hollow Outline Geometric "Z" Mark */}
      <div
        ref={zStageRef}
        className="relative z-20 flex items-center justify-center will-change-transform"
      >
        <svg
          viewBox="0 0 180 200"
          className="w-32 h-36 sm:w-40 sm:h-44 overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="zorbEdgeAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="32%" stopColor={accentHex} />
              <stop offset="100%" stopColor={accentHex} />
            </linearGradient>
          </defs>

          {/* Deep Pure-Black Hollow Core (matches ZORB Hoodie/Cap outline logo) */}
          <path
            ref={zFillPathRef}
            d="M 24 22 H 156 V 54 L 68 146 H 156 V 178 H 24 V 146 L 112 54 H 24 Z"
            fill="#000000"
            style={{ opacity: 0 }}
          />

          {/* Razor-Sharp Outer Theme Outline Trace */}
          <path
            ref={zOutlinePathRef}
            d="M 24 22 H 156 V 54 L 68 146 H 156 V 178 H 24 V 146 L 112 54 H 24 Z"
            fill="none"
            stroke="url(#zorbEdgeAccent)"
            strokeWidth="4.2"
            strokeLinejoin="miter"
            strokeLinecap="square"
            style={{
              filter: `drop-shadow(0 0 12px ${accentHex}88)`,
            }}
          />

          {/* Subtle Inner White Rim Hairline */}
          <path
            ref={zInnerBevelRef}
            d="M 30 28 H 148 V 50 L 59 144 V 152 H 150 V 172 H 30 V 150 L 119 56 V 48 H 30 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.35"
            strokeWidth="1"
            style={{ opacity: 0 }}
          />

          {/* Signature Center Sonic Centerline */}
          <line
            ref={zDiagSlashRef}
            x1="132"
            y1="38"
            x2="48"
            y2="162"
            stroke={accentHex}
            strokeWidth="1.5"
            strokeOpacity="0.7"
            style={{ transformOrigin: '90px 100px', opacity: 0 }}
          />
        </svg>
      </div>

      {/* Stage 2B: Symmetrical ZORB Sonic Light Columns (Strictly Theme Accent + White) */}
      <div
        ref={spectrumWrapRef}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-0"
        aria-hidden="true"
      >
        {columns.map((c, idx) => {
          const barColor =
            c.tone === 'white'
              ? '#FFFFFF'
              : c.tone === 'accent'
              ? accentHex
              : `${accentHex}66`;

          return (
            <div
              key={c.id}
              ref={(el) => {
                colRefs.current[idx] = el;
              }}
              className="absolute will-change-transform rounded-full"
              style={{
                height: `${c.heightPct}%`,
                width: `${c.widthPx}px`,
                background: `linear-gradient(to bottom, transparent 0%, ${barColor} 24%, ${barColor} 76%, transparent 100%)`,
                filter: c.blurPx > 0 ? `blur(${c.blurPx}px)` : undefined,
                opacity: 0,
              }}
            />
          );
        })}
      </div>

      {/* Stage 3: Signature ZORB Outline Wordmark Lockup */}
      <div
        ref={wordmarkRef}
        className="pointer-events-none absolute z-30 flex flex-col items-center text-center px-6 opacity-0 will-change-transform"
      >
        <div className="relative overflow-hidden px-4 py-1">
          <h1
            className="font-display text-6xl sm:text-7xl font-extrabold uppercase tracking-[0.2em] pl-[0.2em] leading-none"
            style={{
              color: '#000000',
              WebkitTextStroke: `2.2px ${accentHex}`,
              textShadow: `0 0 28px ${accentHex}4d`,
            }}
          >
            ZORB
          </h1>

          {/* Crisp Diagonal Light Sheen Sweep */}
          <div
            ref={glintRef}
            className="pointer-events-none absolute inset-y-0 w-16 opacity-0"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
            }}
          />
        </div>

        {/* Hairline Accent Bar */}
        <div
          className="mt-2.5 h-[2px] w-16 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentHex}, transparent)`,
          }}
        />

        <div
          ref={subtitleRef}
          className="mt-3 flex items-center gap-2.5 text-[11px] sm:text-xs font-mono-tabular uppercase tracking-[0.24em] text-[#B3B3B3] opacity-0"
        >
          <span style={{ color: accentHex }} className="font-bold">
            Z = M × D²
          </span>
          <span className="text-white/25">·</span>
          <span>MAKE YOUR FLOW</span>
        </div>
      </div>
    </div>
  );
};
