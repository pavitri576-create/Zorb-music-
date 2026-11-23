import React from 'react';

interface ZorbLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  accentColor?: string;
  showFormula?: boolean;
  className?: string;
}

export const ZorbLogo: React.FC<ZorbLogoProps> = ({
  size = 'md',
  accentColor = 'var(--zorb-accent)',
  showFormula = false,
  className = '',
}) => {
  const sizes = {
    sm: { fontSize: 24, stroke: 1.5, formulaClass: 'text-[9px] mt-0.5' },
    md: { fontSize: 34, stroke: 1.75, formulaClass: 'text-[10px] mt-1' },
    lg: { fontSize: 56, stroke: 2, formulaClass: 'text-sm mt-1.5' },
    xl: { fontSize: 78, stroke: 2.2, formulaClass: 'text-base mt-2' },
  }[size];

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <span
        className="font-display font-extrabold tracking-[0.14em] leading-none uppercase"
        style={{
          fontSize: `${sizes.fontSize}px`,
          color: '#000000',
          WebkitTextStroke: `${sizes.stroke}px ${accentColor}`,
          textShadow: `0 0 22px rgba(var(--zorb-accent-rgb), 0.28)`,
        }}
      >
        ZORB
      </span>
      {showFormula && (
        <span
          className={`font-mono-tabular font-semibold tracking-[0.22em] ${sizes.formulaClass}`}
          style={{ color: accentColor }}
        >
          Z = M × D²
        </span>
      )}
    </div>
  );
};

interface PuzzlePieceSvgProps {
  className?: string;
  color?: string;
}

export const PuzzlePieceIcon: React.FC<PuzzlePieceSvgProps> = ({
  className = 'w-4 h-4',
  color = 'currentColor',
}) => (
  <svg viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
    <path d="M19.5 11H18V7.5C18 6.67 17.33 6 16.5 6H13V4.5C13 3.12 11.88 2 10.5 2C9.12 2 8 3.12 8 4.5V6H4.5C3.67 6 3 6.67 3 7.5V11.3C4.49 11.12 5.75 12.28 5.75 13.75C5.75 15.22 4.49 16.38 3 16.2V19.5C3 20.33 3.67 21 4.5 21H8.3C8.12 19.51 9.28 18.25 10.75 18.25C12.22 18.25 13.38 19.51 13.2 21H16.5C17.33 21 18 20.33 18 19.5V16H19.5C20.88 16 22 14.88 22 13.5C22 12.12 20.88 11 19.5 11Z" />
  </svg>
);

const PUZZLE_POSITIONS = [
  { top: '8%', left: '10%', size: 14, delay: '0s', opacity: 0.45, rotate: -18 },
  { top: '14%', left: '82%', size: 18, delay: '0.7s', opacity: 0.55, rotate: 24 },
  { top: '22%', left: '24%', size: 11, delay: '1.4s', opacity: 0.35, rotate: 12 },
  { top: '28%', left: '72%', size: 13, delay: '2.1s', opacity: 0.4, rotate: -32 },
  { top: '36%', left: '6%', size: 16, delay: '0.4s', opacity: 0.5, rotate: 40 },
  { top: '42%', left: '90%', size: 12, delay: '1.8s', opacity: 0.42, rotate: -12 },
  { top: '52%', left: '16%', size: 12, delay: '2.6s', opacity: 0.32, rotate: 28 },
  { top: '58%', left: '84%', size: 16, delay: '1.1s', opacity: 0.5, rotate: -22 },
  { top: '66%', left: '8%', size: 13, delay: '0.9s', opacity: 0.38, rotate: 15 },
  { top: '72%', left: '76%', size: 11, delay: '2.3s', opacity: 0.35, rotate: -40 },
  { top: '80%', left: '20%', size: 17, delay: '1.5s', opacity: 0.52, rotate: 19 },
  { top: '84%', left: '88%', size: 14, delay: '0.3s', opacity: 0.44, rotate: -14 },
  { top: '18%', left: '52%', size: 10, delay: '1.9s', opacity: 0.28, rotate: 33 },
  { top: '76%', left: '48%', size: 12, delay: '2.8s', opacity: 0.32, rotate: -26 },
  { top: '46%', left: '4%', size: 10, delay: '1.2s', opacity: 0.28, rotate: 8 },
  { top: '32%', left: '94%', size: 15, delay: '0.6s', opacity: 0.4, rotate: 21 },
];

export const FloatingPuzzlePieces: React.FC<{
  count?: number;
  accentColor?: string;
  className?: string;
}> = ({ count = 16, accentColor = 'var(--zorb-accent)', className = '' }) => {
  const pieces = PUZZLE_POSITIONS.slice(0, Math.min(count, PUZZLE_POSITIONS.length));
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {pieces.map((p, idx) => (
        <div
          key={idx}
          className="absolute animate-zorb-float"
          style={{
            top: p.top,
            left: p.left,
            opacity: p.opacity,
            animationDelay: p.delay,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          <div style={{ width: p.size, height: p.size, color: accentColor }}>
            <PuzzlePieceIcon className="w-full h-full drop-shadow-[0_0_8px_rgba(var(--zorb-accent-rgb),0.55)]" />
          </div>
        </div>
      ))}
    </div>
  );
};
