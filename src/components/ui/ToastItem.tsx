import React, { useEffect, useRef, useState } from "react";
import { CheckCircle, AlertTriangle, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: number) => void;
}) => {
  const [progress, setProgress] = useState(100);
  const startX = useRef(0);
  const offsetX = useRef(0);
  const [dragX, setDragX] = useState(0);

  useEffect(() => {
    // Error toasts persist until manually dismissed
    if (toast.type === "error") return;

    const duration = 3000;
    const interval = 50;
    const step = (100 * interval) / duration;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        return next <= 0 ? 0 : next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.type]);

  useEffect(() => {
    if (progress <= 0) onRemove(toast.id);
  }, [progress]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    offsetX.current = e.touches[0].clientX - startX.current;
    setDragX(offsetX.current);
  };

  const handleTouchEnd = () => {
    if (Math.abs(dragX) > 80) {
      onRemove(toast.id);
    }
    setDragX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;

    const onMove = (ev: MouseEvent) => {
      offsetX.current = ev.clientX - startX.current;
      setDragX(offsetX.current);
    };

    const onUp = () => {
      if (Math.abs(offsetX.current) > 80) {
        onRemove(toast.id);
      }
      setDragX(0);

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={toast.type === "success" ? handleMouseDown : undefined}
      style={{ transform: `translateX(${dragX}px)` }}
      className={`
        relative w-[320px] overflow-hidden
        px-4 py-3 rounded-xl shadow-xl backdrop-blur-md
        text-white flex items-start gap-3
        transition-transform duration-150
        ${toast.type === "success" ? "bg-green-500/90 cursor-grab active:cursor-grabbing" : "bg-red-500/90"}
      `}
    >
      <div className="mt-0.5 shrink-0">
        {toast.type === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <AlertTriangle className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>

      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 mt-0.5 p-0.5 rounded opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>

      {toast.type === "success" && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/20">
          <div
            className="h-full bg-white/70 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
