"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Lang = "json" | "html" | "text" | "bash" | "txt";

/**
 * Minimal tint, ink shades only: keys/tags bold ink, strings ink-2, punctuation ink-3. Generated
 * fixes are meant to be read and pasted, not admired, so no rainbow theme.
 * shortcut: regex tokenizer for json/html only, upgrade to a real highlighter if we add languages.
 */
function tint(line: string, lang: Lang) {
  if (lang === "json") {
    const parts = line.split(/("(?:[^"\\]|\\.)*"\s*:?)/g);
    return parts.map((p, i) =>
      p.startsWith('"') ? (
        <span key={i} className={p.trimEnd().endsWith(":") ? "font-medium text-ink" : "text-ink-2"}>{p}</span>
      ) : (
        <span key={i} className="text-ink-3">{p}</span>
      ),
    );
  }
  if (lang === "html") {
    const parts = line.split(/(<\/?[a-zA-Z][^>]*>)/g);
    return parts.map((p, i) => (p.startsWith("<") ? <span key={i} className="text-ink-3">{p}</span> : <span key={i} className="text-ink">{p}</span>));
  }
  if (lang === "bash" && line.trimStart().startsWith("#")) return <span className="text-ink-3">{line}</span>;
  return <span className="text-ink">{line}</span>;
}

export function CodeBlock({
  code,
  language,
  filename,
  copyable = true,
  className,
}: {
  code: string;
  language: Lang;
  filename?: string;
  copyable?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <figure className={cn("overflow-hidden rounded-md border border-line bg-surface", className)}>
      <figcaption className="flex items-center justify-between gap-2 border-b border-line bg-fill px-3 py-1.5">
        <span className="font-mono text-micro tracking-normal text-ink-2">{filename ?? language}</span>
        {copyable && (
          <button type="button" onClick={copy} className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-small text-ink-2 hover:bg-surface hover:text-ink focus-visible:focus-ring">
            {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
            <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </figcaption>
      <pre className="overflow-x-auto py-3 text-[0.8125rem] leading-6">
        <code>
          {lines.map((l, i) => (
            <span key={i} className="grid grid-cols-[3rem_1fr]">
              <span aria-hidden className="select-none pr-3 text-right text-ink-3 tabular">{i + 1}</span>
              <span className="whitespace-pre pr-4">{tint(l, language)}</span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
