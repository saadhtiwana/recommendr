"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }).format(new Date(iso));

const STATUS = {
  active: { label: "Active", cls: "text-up" },
  invalid: { label: "Invalid: provider rejected it", cls: "text-down" },
  revoked: { label: "Revoked", cls: "text-ink-3" },
} as const;

/**
 * A saved provider key. Keys are write-only (ADR-0022): the API only ever returns the provider
 * and last 4 characters, so this component has no way to reveal the secret, by design.
 */
export function SecretField({
  provider,
  label,
  last4,
  createdIso,
  lastUsedIso,
  status,
  onRevoke,
  onReplace,
  className,
}: {
  provider: string;
  label?: string;
  last4: string;
  createdIso: string;
  lastUsedIso: string | null;
  status: "active" | "invalid" | "revoked";
  onRevoke?: () => void;
  onReplace?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-line bg-surface px-4 py-3", className)}>
      <div className="flex min-w-48 items-center gap-2">
        <KeyRound aria-hidden className="size-4 text-ink-3" />
        <div>
          <div className="text-small font-medium text-ink">{provider}</div>
          {label && <div className="text-micro tracking-normal text-ink-3">{label}</div>}
        </div>
      </div>
      <code className="font-mono text-data text-ink tabular" aria-label={`Key ending in ${last4}`}>
        <span aria-hidden className="text-ink-3">•••• •••• </span>
        {last4}
      </code>
      <dl className="flex gap-6 text-small">
        <div>
          <dt className="text-micro tracking-normal text-ink-3">Added</dt>
          <dd className="font-mono tabular text-ink-2">{date(createdIso)}</dd>
        </div>
        <div>
          <dt className="text-micro tracking-normal text-ink-3">Last used</dt>
          <dd className="font-mono tabular text-ink-2">{lastUsedIso ? date(lastUsedIso) : "Never"}</dd>
        </div>
      </dl>
      <span className={cn("text-small", STATUS[status].cls)}>{STATUS[status].label}</span>
      <div className="ml-auto flex gap-2">
        {onReplace && (
          <Button variant="secondary" size="sm" onClick={onReplace}>
            Replace
          </Button>
        )}
        {onRevoke && status !== "revoked" && (
          <Button variant="destructive" size="sm" onClick={onRevoke}>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
}

type ValidateState = "idle" | "validating" | "valid" | "invalid";

/** Add-a-key input. The value lives only in this input until saved; it is never echoed back. */
export function NewSecretInput({
  provider,
  onValidate,
  state = "idle",
  error,
  className,
}: {
  provider: string;
  onValidate: (key: string) => void;
  state?: ValidateState;
  error?: string;
  className?: string;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <form
      className={cn("flex flex-col gap-1.5", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onValidate(value.trim());
      }}
    >
      <label htmlFor={id} className="text-small font-medium text-ink">
        {provider} API key
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste your key"
          aria-invalid={state === "invalid" || undefined}
          aria-describedby={`${id}-hint`}
          className={cn(
            "h-9 min-w-0 flex-1 rounded-sm border bg-surface px-3 font-mono text-data text-ink placeholder:text-ink-3 focus-visible:focus-ring",
            state === "invalid" ? "border-down" : "border-line-strong",
          )}
        />
        <Button type="submit" variant="primary" disabled={!value.trim() || state === "validating"}>
          {state === "validating" ? (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin" /> Checking
            </>
          ) : (
            "Validate and save"
          )}
        </Button>
      </div>
      <p id={`${id}-hint`} className={cn("text-small", state === "invalid" ? "text-down" : state === "valid" ? "text-up" : "text-ink-3")} aria-live="polite">
        {state === "invalid"
          ? error ?? "The provider rejected this key."
          : state === "valid"
            ? "Key works. Saved and encrypted; you won't see it again."
            : "We make one free test call to check it. After saving, only the last 4 characters are shown."}
      </p>
    </form>
  );
}
