import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaItem {
  url: string;
  type: "photo" | "video" | "audio";
}

interface MediaLightboxProps {
  items: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function parseMediaUrl(raw: string): MediaItem {
  const hashType = raw.includes("#") ? raw.split("#")[1] : "";
  const url = raw.split("#")[0];
  if (raw.startsWith("data:video") || hashType === "video") return { url, type: "video" };
  if (raw.startsWith("data:audio") || hashType === "audio") return { url, type: "audio" };
  return { url, type: "photo" };
}

export function MediaLightbox({ items, initialIndex = 0, open, onClose }: MediaLightboxProps) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => { setIdx(initialIndex); }, [initialIndex, open]);

  const prev = useCallback(() => setIdx((i) => (i - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, prev, next, onClose]);

  if (!open || items.length === 0) return null;

  const item = items[idx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/80 text-sm font-medium tabular-nums">
          {idx + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2">
          {item.type === "photo" && (
            <a
              href={item.url}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media */}
      <div
        className="relative max-w-[92vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            preload="metadata"
            className="max-w-[92vw] max-h-[85vh] rounded-lg shadow-2xl"
          />
        ) : item.type === "audio" ? (
          <div className="bg-secondary rounded-xl p-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <audio key={item.url} src={item.url} controls autoPlay className="w-64" />
          </div>
        ) : (
          <img
            key={item.url}
            src={item.url}
            alt={`Media ${idx + 1}`}
            className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        )}
      </div>

      {/* Navigation */}
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 sm:left-4 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 sm:right-4 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === idx ? "bg-white w-4" : "bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface MediaThumbProps {
  item: MediaItem;
  index: number;
  onOpen: (index: number) => void;
  onDelete?: (index: number) => void;
  size?: "sm" | "md";
}

export function MediaThumb({ item, index, onOpen, onDelete, size = "md" }: MediaThumbProps) {
  const dim = size === "sm" ? "w-20 h-20" : "w-24 h-24";
  return (
    <div className={cn("relative group rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0", dim)}>
      {item.type === "video" ? (
        <div
          className="w-full h-full flex items-center justify-center bg-black/80 cursor-pointer"
          onClick={() => onOpen(index)}
        >
          <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      ) : item.type === "audio" ? (
        <div
          className="w-full h-full flex items-center justify-center bg-secondary cursor-pointer"
          onClick={() => onOpen(index)}
        >
          <svg className="w-6 h-6 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
      ) : (
        <img
          src={item.url}
          alt={`Media ${index + 1}`}
          loading="lazy"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onOpen(index)}
        />
      )}

      {/* Hover overlay */}
      <div
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 cursor-pointer"
        onClick={() => onOpen(index)}
      >
        <ZoomIn className="w-4 h-4 text-white" />
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(index); }}
          className="absolute top-1 right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}
