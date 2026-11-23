import React, { useState } from 'react';

interface CoverArtProps {
  src: string;
  alt: string;
  className?: string;
}

export const CoverArt: React.FC<CoverArtProps> = ({ src, alt, className = '' }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[#121212] ${className}`}>
      {!loaded && !errored && <div className="absolute inset-0 zorb-skeleton" aria-hidden="true" />}
      {!errored ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="w-full h-full bg-[#181818] flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
          ZORB
        </div>
      )}
    </div>
  );
};

export const LiveEqualizerBars: React.FC<{ color: string; isPlaying?: boolean }> = ({
  color,
  isPlaying = true,
}) => (
  <span className="inline-flex items-end gap-[2px] h-3.5 w-3.5 shrink-0" aria-hidden="true">
    <span
      className={`w-[3px] h-full rounded-full ${isPlaying ? 'zorb-eq-bar' : ''}`}
      style={{ backgroundColor: color, animationDelay: '0ms', transform: isPlaying ? undefined : 'scaleY(0.35)' }}
    />
    <span
      className={`w-[3px] h-full rounded-full ${isPlaying ? 'zorb-eq-bar' : ''}`}
      style={{ backgroundColor: color, animationDelay: '180ms', transform: isPlaying ? undefined : 'scaleY(0.65)' }}
    />
    <span
      className={`w-[3px] h-full rounded-full ${isPlaying ? 'zorb-eq-bar' : ''}`}
      style={{ backgroundColor: color, animationDelay: '340ms', transform: isPlaying ? undefined : 'scaleY(0.45)' }}
    />
  </span>
);
