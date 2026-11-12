import Link from "next/link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingFlow } from "./_flow";
import { Logo } from "@/components/brand/logo";
import { PreviewFooter } from "@/components/brand/preview-chrome";

export default function OnboardingPreview() {
  return (
    <TooltipProvider>
      <div className="min-h-screen overflow-x-hidden bg-bg">
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-5 md:px-8">
            <Link href="/design/landing" aria-label="Recommendr home">
              <Logo variant="full" height={24} />
            </Link>
            <Link href="/design/dashboard" className="text-small text-ink-3 hover:text-ink">Save and exit</Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1100px] px-5 py-8 md:px-8 lg:py-12">
          <h1 className="mx-auto mb-8 max-w-xl font-serif text-h1">Create a project</h1>
          <OnboardingFlow />
        </main>
      <PreviewFooter />
      </div>
    </TooltipProvider>
  );
}
