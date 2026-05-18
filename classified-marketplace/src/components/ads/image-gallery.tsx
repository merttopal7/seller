"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ImageGalleryProps {
  images: { url: string; id: string }[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});
  const [lightbox, setLightbox] = useState(false);

  const fallback = (idx: number) =>
    imgErrors[idx]
      ? `https://picsum.photos/seed/ad${idx}/800/600`
      : images[idx]?.url || `https://picsum.photos/seed/nophoto/800/600`;

  const prev = useCallback(() => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0)), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No images</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted group cursor-zoom-in"
          onClick={() => setLightbox(true)}
        >
          <Image
            src={fallback(current)}
            alt={`${title} - image ${current + 1}`}
            fill
            className="object-cover"
            priority
            onError={() => setImgErrors((e) => ({ ...e, [current]: true }))}
            sizes="(max-width: 768px) 100vw, 60vw"
          />

          {/* Zoom hint */}
          <div className="absolute top-3 left-3 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-4 w-4" />
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === current ? "w-6 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {current + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrent(idx)}
                className={`relative flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === current
                    ? "border-primary shadow-md"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgErrors[idx] ? `https://picsum.photos/seed/ad${idx}/200/150` : img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setLightbox(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-white/70 text-sm">{title}</span>
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm">{current + 1} / {images.length}</span>
              <button
                onClick={() => setLightbox(false)}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main image area */}
          <div
            className="flex-1 relative flex items-center justify-center min-h-0 px-12"
            style={{ paddingBottom: images.length === 1 ? "env(safe-area-inset-bottom)" : undefined }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full">
              <Image
                src={fallback(current)}
                alt={`${title} - image ${current + 1}`}
                fill
                className="object-contain"
                priority
                sizes="100vw"
                onError={() => setImgErrors((e) => ({ ...e, [current]: true }))}
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2 justify-center overflow-x-auto" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrent(idx)}
                  className={`relative flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === current ? "border-white" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={imgErrors[idx] ? `https://picsum.photos/seed/ad${idx}/200/150` : img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
