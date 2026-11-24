import React, { useEffect, useRef } from 'react';

interface SplashScreenProps {
  accentHex: string;
  onComplete: () => void;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// After Effects Graph Editor style curves
function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeOutQuart(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 4);
}

function easeInOutExpo(t: number): number {
  const x = clamp01(t);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * 3.2-Second After Effects Style Studio Ident (No Skip Button)
 * - [0.00s - 0.65s] SVG Trim-Path Emblem draw + Horizon hairline wipe
 * - [0.45s - 1.35s] Track-Matte masked ZORB wordmark rise + exponential tracking settle
 * - [1.15s - 2.25s] Specular light sweep + accent bar compression + Subtitle matte reveal
 * - [2.25s - 3.20s] Clean lock-in hold + seamless 1.035x push-out dissolve into Home
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ accentHex, onComplete }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const emblemBoxRef = useRef<SVGRectElement | null>(null);
  const bar1Ref = useRef<SVGLineElement | null>(null);
  const bar2Ref = useRef<SVGLineElement | null>(null);
  const bar3Ref = useRef<SVGLineElement | null>(null);
  const wordmarkRef = useRef<HTMLSpanElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const ruleRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLSpanElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const TOTAL_MS = prefersReduced ? 1200 : 3200;
    const start = performance.now();
    let rafId = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      onCompleteRef.current();
    };

    const tick = (now: number) => {
      const elapsedMs = now - start;
      const t = elapsedMs / 1000;

      if (prefersReduced) {
        if (emblemBoxRef.current) emblemBoxRef.current.style.strokeDashoffset = '0';
        if (bar1Ref.current) bar1Ref.current.style.strokeDashoffset = '0';
        if (bar2Ref.current) bar2Ref.current.style.strokeDashoffset = '0';
        if (bar3Ref.current) bar3Ref.current.style.strokeDashoffset = '0';
        if (wordmarkRef.current) {
          wordmarkRef.current.style.opacity = '1';
          wordmarkRef.current.style.transform = 'translate3d(0, 0, 0)';
          wordmarkRef.current.style.letterSpacing = '0.1em';
        }
        if (ruleRef.current) {
          ruleRef.current.style.opacity = '1';
          ruleRef.current.style.transform = 'scaleX(0.28)';
        }
        if (subtitleRef.current) {
          subtitleRef.current.style.opacity = '0.75';
          subtitleRef.current.style.transform = 'translate3d(0, 0, 0)';
        }
        if (rootRef.current) {
          const fadeOut = t > 0.85 ? easeInOutCubic((t - 0.85) / 0.35) : 0;
          rootRef.current.style.opacity = `${clamp01(1 - fadeOut).toFixed(4)}`;
        }
        if (elapsedMs >= TOTAL_MS) {
          finish();
          return;
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      // 1. Emblem Trim Path (0.08s -> 0.72s)
      const boxP = easeInOutExpo((t - 0.08) / 0.64);
      if (emblemBoxRef.current) {
        const perimeter = 148;
        emblemBoxRef.current.style.strokeDashoffset = `${(perimeter * (1 - boxP)).toFixed(2)}`;
        emblemBoxRef.current.style.opacity = `${clamp01(t / 0.14).toFixed(3)}`;
      }

      // 3 inner acoustic equalizer trim paths with staggered rhythm (0.28s -> 0.85s)
      const bars = [
        { ref: bar1Ref.current, delay: 0.28, len: 14, phase: 0.0 },
        { ref: bar2Ref.current, delay: 0.36, len: 22, phase: 1.4 },
        { ref: bar3Ref.current, delay: 0.44, len: 16, phase: 2.8 },
      ];
      for (const b of bars) {
        if (!b.ref) continue;
        const bp = easeOutExpo((t - b.delay) / 0.42);
        b.ref.style.strokeDashoffset = `${(b.len * (1 - bp)).toFixed(2)}`;
        b.ref.style.opacity = `${clamp01((t - b.delay) / 0.12).toFixed(3)}`;
        // Subtle live breath between 1.0s and 2.5s
        if (t > 0.9 && t < 2.6) {
          const breathEnv = Math.sin(clamp01((t - 0.9) / 1.7) * Math.PI);
          const scaleY = 1 + Math.sin(t * 7.2 + b.phase) * 0.16 * breathEnv;
          b.ref.style.transform = `scaleY(${scaleY.toFixed(3)})`;
        } else {
          b.ref.style.transform = 'scaleY(1)';
        }
      }

      // 2. Track-Matte Wordmark Rise + Kerning Settle (0.46s -> 1.38s)
      if (wordmarkRef.current) {
        const revealP = easeOutExpo((t - 0.46) / 0.88);
        const trackP = easeOutQuart((t - 0.52) / 0.92);
        const yPct = (1 - revealP) * 108;
        const trackingEm = 0.28 - trackP * 0.17; // 0.28em -> 0.11em
        wordmarkRef.current.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
        wordmarkRef.current.style.letterSpacing = `${trackingEm.toFixed(4)}em`;
        wordmarkRef.current.style.opacity = `${clamp01((t - 0.46) / 0.2).toFixed(3)}`;
      }

      // 3. Horizon Hairline -> Compact Accent Rule (0.05s -> 1.45s)
      if (ruleRef.current) {
        if (t < 0.72) {
          const expand = easeInOutExpo((t - 0.05) / 0.55);
          ruleRef.current.style.transform = `scaleX(${expand.toFixed(4)})`;
          ruleRef.current.style.opacity = `${(0.85 * clamp01(t / 0.15)).toFixed(3)}`;
        } else {
          const compress = easeInOutExpo((t - 0.72) / 0.65);
          const scaleX = 1 - compress * 0.74; // settles to crisp 0.26 ratio bar
          ruleRef.current.style.transform = `scaleX(${scaleX.toFixed(4)})`;
          ruleRef.current.style.opacity = '0.95';
        }
      }

      // 4. Subtle Specular Light Sweep across Wordmark (1.28s -> 2.05s)
      if (sheenRef.current) {
        if (t >= 1.28 && t <= 2.08) {
          const sp = easeInOutCubic((t - 1.28) / 0.8);
          const xPct = -130 + sp * 260;
          sheenRef.current.style.transform = `translate3d(${xPct.toFixed(1)}%, 0, 0) skewX(-18deg)`;
          sheenRef.current.style.opacity = `${(Math.sin(sp * Math.PI) * 0.42).toFixed(3)}`;
        } else {
          sheenRef.current.style.opacity = '0';
        }
      }

      // 5. Subtitle Track-Matte Reveal (1.22s -> 1.95s)
      if (subtitleRef.current) {
        const subP = easeOutQuart((t - 1.22) / 0.68);
        const yPct = (1 - subP) * 105;
        subtitleRef.current.style.transform = `translate3d(0, ${yPct.toFixed(2)}%, 0)`;
        subtitleRef.current.style.opacity = `${(subP * 0.72).toFixed(3)}`;
      }

      // 6. Subtle Studio Ambient Vignette Depth (0.0s -> 3.2s)
      if (glowRef.current) {
        const inP = easeOutQuart(t / 1.4);
        const outP = t > 2.6 ? easeInOutCubic((t - 2.6) / 0.6) : 0;
        const op = inP * 0.22 * (1 - outP);
        glowRef.current.style.opacity = `${op.toFixed(3)}`;
      }

      // 7. Final Camera Micro Push-Out & Seamless Dissolve (2.72s -> 3.20s)
      if (stageRef.current && rootRef.current) {
        if (t >= 2.72) {
          const outP = easeInOutCubic((t - 2.72) / 0.48);
          const scale = 1 + outP * 0.036;
          stageRef.current.style.transform = `scale(${scale.toFixed(4)})`;
          rootRef.current.style.opacity = `${clamp01(1 - outP).toFixed(4)}`;
        } else {
          stageRef.current.style.transform = 'scale(1)';
          rootRef.current.style.opacity = '1';
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
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none will-change-transform"
      aria-label="ZORB splash intro"
    >
      {/* Subtle Studio Radial Vignette */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute w-[420px] h-[420px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentHex}55 0%, ${accentHex}14 42%, transparent 72%)`,
          filter: 'blur(64px)',
          opacity: 0,
        }}
      />

      {/* Centered Composition Stage */}
      <div
        ref={stageRef}
        className="relative z-10 flex flex-col items-center px-6 will-change-transform"
      >
        {/* Architectural SVG Trim-Path Emblem */}
        <svg
          width="46"
          height="46"
          viewBox="0 0 46 46"
          fill="none"
          className="mb-5"
          aria-hidden="true"
        >
          <rect
            ref={emblemBoxRef}
            x="4"
            y="4"
            width="38"
            height="38"
            rx="10"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.75"
            strokeDasharray="148"
            strokeDashoffset="148"
            style={{ opacity: 0 }}
          />
          <line
            ref={bar1Ref}
            x1="15.5"
            y1="16"
            x2="15.5"
            y2="30"
            stroke={accentHex}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="14"
            strokeDashoffset="14"
            style={{ opacity: 0, transformOrigin: '15.5px 23px' }}
          />
          <line
            ref={bar2Ref}
            x1="23"
            y1="12"
            x2="23"
            y2="34"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="22"
            strokeDashoffset="22"
            style={{ opacity: 0, transformOrigin: '23px 23px' }}
          />
          <line
            ref={bar3Ref}
            x1="30.5"
            y1="15"
            x2="30.5"
            y2="31"
            stroke={accentHex}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="16"
            strokeDashoffset="16"
            style={{ opacity: 0, transformOrigin: '30.5px 23px' }}
          />
        </svg>

        {/* Track-Matte Wordmark Reveal */}
        <div className="relative overflow-hidden py-1 px-3">
          <span
            ref={wordmarkRef}
            className="block font-display text-6xl sm:text-7xl font-extrabold uppercase leading-none text-white will-change-transform"
            style={{
              opacity: 0,
              letterSpacing: '0.28em',
              transform: 'translate3d(0, 108%, 0)',
              marginRight: '-0.11em', // optical centering for tracking
            }}
          >
            ZORB
          </span>

          {/* Subtle Specular Sheen Pass */}
          <div
            ref={sheenRef}
            className="pointer-events-none absolute inset-y-0 w-16 will-change-transform"
            style={{
              opacity: 0,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.38) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* Precision Accent Hairline Rule */}
        <div
          ref={ruleRef}
          className="mt-3 h-[2px] w-40 rounded-full will-change-transform"
          style={{
            backgroundColor: accentHex,
            opacity: 0,
            transform: 'scaleX(0)',
          }}
        />

        {/* Track-Matte Subtitle Reveal */}
        <div className="mt-3.5 overflow-hidden">
          <span
            ref={subtitleRef}
            className="block font-mono-tabular text-[11px] sm:text-xs font-medium uppercase tracking-[0.32em] text-zinc-300 will-change-transform"
            style={{
              opacity: 0,
              transform: 'translate3d(0, 105%, 0)',
              marginRight: '-0.32em',
            }}
          >
            MAKE YOUR FLOW
          </span>
        </div>
      </div>
    </div>
  );
};
