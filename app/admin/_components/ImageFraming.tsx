"use client";

import { useCallback, useRef, useState } from "react";
import { RotateCcw, RotateCw, Crop, Check, X, Loader2, Move, Undo2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const VIEW = 240; // editor viewport, px
const OUT = 640; // exported square, px

/**
 * Rotate, zoom and reposition a contender's artwork inside its frame.
 *
 * Every holder on the site crops to a square with `object-cover`, so an
 * off-centre or sideways source photo lands badly and the only fix used to be
 * finding a better file. The transform is baked into a fresh upload rather
 * than stored as columns, so every consumer — cards, hero, feed, profile —
 * shows the framed version with no extra plumbing. The original file stays in
 * the bucket, so a bad crop costs nothing.
 */
export default function ImageFraming({
  value,
  onChange,
  bucket = "contenders",
}: {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = useCallback(() => {
    setRotation(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError(null);
  }, []);

  // Cover-fit the source into the square before any user transform, so zoom 1
  // is exactly what the site already shows.
  const base = natural
    ? (() => {
        const scale = Math.max(VIEW / natural.w, VIEW / natural.h);
        return { w: natural.w * scale, h: natural.h * scale };
      })()
    : { w: VIEW, h: VIEW };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  const apply = async () => {
    const img = imgRef.current;
    if (!img || !natural) return;

    setBusy(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable in this browser.");

      // Same transform as the preview, scaled from viewport to export size.
      const k = OUT / VIEW;
      const w = base.w * zoom * k;
      const h = base.h * zoom * k;

      ctx.imageSmoothingQuality = "high";
      ctx.translate(OUT / 2 + offset.x * k, OUT / 2 + offset.y * k);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        // Tainted canvases throw here rather than at draw time.
        canvas.toBlob(resolve, "image/webp", 0.92)
      );
      if (!blob) throw new Error("Could not read the framed image.");

      const supabase = createClient();
      const path = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { cacheControl: "3600", contentType: "image/webp" });

      if (storageError) throw new Error(storageError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      onChange(publicUrl);
      setOpen(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not reframe that image.";
      setError(
        /tainted|secur/i.test(message)
          ? "This image's host blocks re-cropping. Upload a copy of the file instead, then reframe it."
          : message
      );
    } finally {
      setBusy(false);
    }
  };

  if (!value) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // Each session starts from the image as it is stored, not from the
          // last edit's leftovers.
          reset();
          setOpen(true);
        }}
        className="self-start inline-flex items-center gap-1.5 rounded-lg border border-border/60
                   bg-muted/40 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider
                   text-muted-foreground hover:text-primary hover:border-primary/50
                   transition-colors cursor-pointer"
      >
        <Crop className="w-3 h-3" /> Reframe image
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-background border border-border/60 rounded-xl">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Viewport. The checkerboard shows where the frame is empty, so a
            rotation that leaves gaps is obvious before it is applied. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative shrink-0 self-center overflow-hidden rounded-xl border border-border
                     cursor-grab active:cursor-grabbing touch-none select-none"
          style={{
            width: VIEW,
            height: VIEW,
            backgroundImage:
              "linear-gradient(45deg, var(--muted) 25%, transparent 25%, transparent 75%, var(--muted) 75%), linear-gradient(45deg, var(--muted) 25%, transparent 25%, transparent 75%, var(--muted) 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 8px 8px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={value}
            alt="Reframe preview"
            crossOrigin="anonymous"
            draggable={false}
            onLoad={(e) =>
              setNatural({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              })
            }
            onError={() => setError("That image could not be loaded for reframing.")}
            className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
            style={{
              width: base.w * zoom,
              height: base.h * zoom,
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
            }}
          />

          <span className="absolute inset-0 pointer-events-none border border-white/20 rounded-xl" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
              Rotate · {rotation}°
            </span>
            <div className="flex items-center gap-2">
              <IconBtn label="Rotate left" onClick={() => setRotation((r) => (r - 90) % 360)}>
                <RotateCcw className="w-3.5 h-3.5" />
              </IconBtn>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                aria-label="Rotation"
                className="flex-1 accent-[var(--primary)] cursor-pointer"
              />
              <IconBtn label="Rotate right" onClick={() => setRotation((r) => (r + 90) % 360)}>
                <RotateCw className="w-3.5 h-3.5" />
              </IconBtn>
            </div>
          </div>

          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
              Zoom · {zoom.toFixed(2)}×
            </span>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="w-full accent-[var(--primary)] cursor-pointer"
            />
          </div>

          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
            <Move className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Drag the image to choose the focal point. The square is exactly what the
              cards, hero and feed will crop to.</span>
          </p>

          <button
            type="button"
            onClick={reset}
            className="self-start inline-flex items-center gap-1.5 font-mono text-[10px] uppercase
                       tracking-wider text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <Undo2 className="w-3 h-3" /> Reset framing
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-red-500 font-sans">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40
                     px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider
                     text-muted-foreground hover:text-foreground transition-colors cursor-pointer
                     disabled:opacity-50"
        >
          <X className="w-3 h-3" /> Cancel
        </button>

        <button
          type="button"
          onClick={apply}
          disabled={busy || !natural}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground
                     px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider
                     hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {busy ? "Saving" : "Apply framing"}
        </button>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 rounded-lg border border-border/60 bg-muted/40 p-2 text-muted-foreground
                 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
