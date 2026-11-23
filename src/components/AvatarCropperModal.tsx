import React, { useEffect, useRef, useState } from 'react';
import { Circle, RotateCw, Square, Upload, X, ZoomIn } from 'lucide-react';

interface AvatarCropperModalProps {
  isOpen: boolean;
  initialImage?: string;
  accentHex: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  isOpen,
  initialImage,
  accentHex,
  onClose,
  onSave,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [cropShape, setCropShape] = useState<'circle' | 'square'>('circle');
  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setImageSrc(initialImage || null);
      setZoom(1.1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, initialImage]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setZoom(1.1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
    });
  };

  const handlePointerUp = () => setDragging(false);

  const handleConfirmSave = () => {
    if (!imageSrc || !imgElementRef.current) return;
    const img = imgElementRef.current;
    const outputSize = 360;
    const previewSize = 240;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, outputSize, outputSize);

    if (cropShape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    const scaleFactor = outputSize / previewSize;
    const natW = img.naturalWidth || 300;
    const natH = img.naturalHeight || 300;
    const baseScale = Math.max(previewSize / natW, previewSize / natH);

    ctx.translate(outputSize / 2 + offset.x * scaleFactor, outputSize / 2 + offset.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(baseScale * zoom * scaleFactor, baseScale * zoom * scaleFactor);
    ctx.drawImage(img, -natW / 2, -natH / 2, natW, natH);

    if (cropShape === 'circle') {
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/png', 0.92);
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0B0D12] border border-white/15 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide">
            Crop Profile Photo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300"
            aria-label="Close cropper"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!imageSrc ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-60 rounded-2xl border border-dashed border-white/25 bg-black/60 flex flex-col items-center justify-center gap-3 hover:border-white/45 transition-colors cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `rgba(var(--zorb-accent-rgb), 0.16)`, color: accentHex }}
            >
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-white">Choose Photo From Gallery</span>
            <span className="text-xs text-zinc-400">Supports PNG, JPG, WEBP</span>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-black/70 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setCropShape('circle')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cropShape === 'circle' ? 'text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  style={cropShape === 'circle' ? { backgroundColor: accentHex } : undefined}
                >
                  <Circle className="w-3.5 h-3.5" /> Circle
                </button>
                <button
                  type="button"
                  onClick={() => setCropShape('square')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    cropShape === 'square' ? 'text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                  style={cropShape === 'square' ? { backgroundColor: accentHex } : undefined}
                >
                  <Square className="w-3.5 h-3.5" /> Square
                </button>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Replace
              </button>
            </div>

            <div className="flex justify-center">
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="relative w-60 h-60 bg-black overflow-hidden touch-none cursor-grab active:cursor-grabbing border-2 select-none"
                style={{
                  borderRadius: cropShape === 'circle' ? '9999px' : '16px',
                  borderColor: accentHex,
                }}
              >
                <img
                  ref={imgElementRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                  style={{
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 text-xs text-zinc-300">
                <ZoomIn className="w-4 h-4 shrink-0 text-zinc-400" />
                <span className="w-12 shrink-0">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-current"
                  style={{ color: accentHex }}
                />
                <span className="w-10 text-right font-mono-tabular text-zinc-400">{zoom.toFixed(1)}x</span>
              </label>

              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <RotateCw className="w-4 h-4 shrink-0 text-zinc-400" />
                <span className="w-12 shrink-0">Rotate</span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                  className="flex-1 accent-current"
                  style={{ color: accentHex }}
                />
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90 > 180 ? r - 270 : r + 90))}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-mono-tabular"
                >
                  +90°
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-black active:scale-[0.98] transition-transform"
                style={{ backgroundColor: accentHex }}
              >
                Save Photo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
