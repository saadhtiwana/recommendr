import { useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes, cloneElement } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-md border border-line-strong bg-surface text-small text-ink placeholder:text-ink-3 transition-colors duration-[var(--duration-fast)] " +
  "hover:border-ink-3 focus-visible:border-ink focus-visible:focus-ring disabled:cursor-not-allowed disabled:bg-fill disabled:text-ink-3 " +
  "aria-[invalid=true]:border-down";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-8 px-2.5", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "min-h-20 px-2.5 py-2 leading-relaxed", className)} {...props} />;
}

/** Label + control + hint/error. Wires id, aria-describedby and aria-invalid onto the child control. */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  className?: string;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const control = cloneElement(children, {
    id: children.props.id ?? id,
    "aria-describedby": hint || error ? noteId : undefined,
    "aria-invalid": error ? true : undefined,
  });
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={children.props.id ?? id} className="text-small font-medium text-ink">
        {label}
      </label>
      {control}
      {error ? (
        <p id={noteId} className="text-small text-down">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="text-small text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
