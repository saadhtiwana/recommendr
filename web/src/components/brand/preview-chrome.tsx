import Link from "next/link";
import { Logo } from "./logo";

/** Header for standalone /design preview pages (dashboard pages use AppShell instead). */
export function PreviewHeader() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <Link href="/design" aria-label="Design previews home">
          <Logo variant="full" height={24} />
        </Link>
        <p className="text-micro uppercase text-ink-3">Design previews · development only</p>
      </div>
    </header>
  );
}

export function PreviewFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-8">
        <Logo variant="full" tone="mono" height={20} className="text-ink-3" />
        <p className="text-small text-ink-3">Free and open source under AGPL-3.0. Fictional businesses in all previews.</p>
      </div>
    </footer>
  );
}
