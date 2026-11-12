import { clsx, type ClassValue } from "clsx";

/** Join class names conditionally. No tailwind-merge: components avoid conflicting overrides. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
