"use client";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Toast as RToast } from "radix-ui";
import { ArrowDownRight, ArrowUpRight, X } from "lucide-react";
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
      <RToast.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((t) => (
          <RToast.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className="flex w-full animate-pop-in items-start gap-3 rounded-md border border-line bg-surface p-3 shadow-overlay"
          >
            {t.tone === "up" ? <ArrowUpRight size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-up" aria-hidden /> : null}
            {t.tone === "down" ? <ArrowDownRight size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-down" aria-hidden /> : null}
            <div className="min-w-0 flex-1">
              <RToast.Title className="text-small font-medium text-ink">{t.title}</RToast.Title>
              {t.description ? <RToast.Description className="mt-0.5 text-small text-ink-3">{t.description}</RToast.Description> : null}
            </div>
            <RToast.Close className={cn("rounded-sm p-0.5 text-ink-3 hover:bg-fill hover:text-ink focus-visible:focus-ring")} aria-label="Dismiss">
              <X size={14} strokeWidth={1.75} />
            </RToast.Close>
          </RToast.Root>
        ))}
        <RToast.Viewport className="fixed right-4 bottom-4 z-toast flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 outline-none" />
      </RToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): { toast: (t: ToastInput) => void } {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
