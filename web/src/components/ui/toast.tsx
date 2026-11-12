"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast as RToast } from "radix-ui";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "up" | "down";
interface ToastInput {
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
}
interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ toast: (t: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((t: ToastInput) => setItems((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]), []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      <RToast.Provider swipeDirection="right" duration={2600}>
        {children}
        {items.map((t) => (
          <RToast.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className="pointer-events-auto flex animate-pop-in items-center gap-2.5 rounded-full bg-ink py-2.5 pr-5 pl-3 text-white shadow-overlay"
          >
            {/* one short line on a dark pill: confirmation, not a message to read */}
            <span className={cn("flex size-6 items-center justify-center rounded-full", t.tone === "down" ? "bg-down" : "bg-lime text-lime-ink")} aria-hidden>
              {t.tone === "down" ? <X size={13} strokeWidth={2.6} /> : <Check size={13} strokeWidth={2.6} />}
            </span>
            <RToast.Title className="text-small font-semibold">{t.title}</RToast.Title>
            {t.description ? <RToast.Description className="sr-only">{t.description}</RToast.Description> : null}
          </RToast.Root>
        ))}
        <RToast.Viewport className="pointer-events-none fixed bottom-6 left-1/2 z-toast flex -translate-x-1/2 flex-col items-center gap-2 outline-none" />
      </RToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): { toast: (t: ToastInput) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
