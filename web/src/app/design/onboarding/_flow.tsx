"use client";

import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { Field, Input } from "@/components/ui/input";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { NewSecretInput } from "@/components/ui/secret-field";
import { Select } from "@/components/ui/select";
import { EngineLabel } from "@/components/ui/engine-label";
import { cn } from "@/lib/cn";
import { ENGINE_ORDER, ENGINES, type EngineId } from "@/lib/palette";

const STEPS = ["Brand", "Website", "Category & location", "Competitors", "Prompts", "Engines", "Keys or free tier", "Review"] as const;

const CATEGORIES = [
  { value: "biryani-restaurant", label: "Biryani restaurant", hint: "Restaurants" },
  { value: "pakistani-restaurant", label: "Pakistani restaurant", hint: "Restaurants" },
  { value: "dental-clinic", label: "Dental clinic", hint: "Health" },
  { value: "physiotherapy", label: "Physiotherapy clinic", hint: "Health" },
  { value: "wedding-planner", label: "Wedding planner", hint: "Events" },
  { value: "accounting-software", label: "Accounting software", hint: "Software" },
  { value: "cafe", label: "Café", hint: "Restaurants" },
];
const CITIES = [
  { value: "islamabad", label: "Islamabad, Pakistan" },
  { value: "lahore", label: "Lahore, Pakistan" },
  { value: "karachi", label: "Karachi, Pakistan" },
  { value: "leeds", label: "Leeds, United Kingdom" },
  { value: "austin", label: "Austin, Texas, US" },
  { value: "dubai", label: "Dubai, UAE" },
];

const SUGGESTED_COMPETITORS = [
  { name: "Shahi Handi", why: "Named in 31 of 40 sample answers" },
  { name: "Lahori Degh", why: "Named in 19 of 40 sample answers" },
  { name: "Karachi Biryani Centre", why: "Named in 16 of 40 sample answers" },
  { name: "Tandoor & Co.", why: "Named in 8 of 40 sample answers" },
  { name: "Savour Express", why: "Named in 3 of 40 sample answers" },
];

const SUGGESTED_PROMPTS: { intent: string; items: string[] }[] = [
  { intent: "Discovery", items: ["best biryani in Islamabad", "most famous biryani places in Pakistan", "where do locals eat biryani in Islamabad"] },
  { intent: "Specific need", items: ["where to get authentic Sindhi biryani in Islamabad", "catering biryani for 100 people Islamabad", "family restaurant with biryani and private rooms Islamabad"] },
  { intent: "Local", items: ["biryani delivery F-7 Islamabad late night", "biryani restaurant open on Eid Islamabad"] },
  { intent: "Price", items: ["cheap biryani near Blue Area under Rs 800"] },
  { intent: "Comparison", items: ["Shahi Handi vs Dera Biryani House"] },
];

const MODELS: Record<EngineId, { value: string; label: string }[]> = {
  chatgpt: [{ value: "gpt-5.1-search", label: "gpt-5.1-search" }, { value: "gpt-5-mini-search", label: "gpt-5-mini-search (low cost)" }],
  gemini: [{ value: "gemini-3-pro", label: "gemini-3-pro" }, { value: "gemini-3-flash", label: "gemini-3-flash (low cost)" }],
  perplexity: [{ value: "sonar-pro", label: "sonar-pro" }, { value: "sonar", label: "sonar (low cost)" }],
  claude: [{ value: "claude-sonnet-5", label: "claude-sonnet-5" }, { value: "claude-haiku-5", label: "claude-haiku-5 (low cost)" }],
};

// Planning assumption from system-design §4: ~$0.012 per answer with web search, ~$0.006 on low-cost models.
const COST_PER_CALL = 0.012;

function StepHeading({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <p className="font-mono text-small tabular text-ink-3">
        Step {n} of {STEPS.length}
      </p>
      <h2 className="mt-1 font-serif text-h2">{title}</h2>
      {children ? <p className="mt-2 max-w-prose text-ink-2">{children}</p> : null}
    </div>
  );
}

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Dera Biryani House");
  const [aliases, setAliases] = useState("Dera Biryani, Dera House");
  const [website, setWebsite] = useState("derabiryani.pk");
  const [siteRead, setSiteRead] = useState<"idle" | "reading" | "done">("idle");
  const [category, setCategory] = useState("biryani-restaurant");
  const [city, setCity] = useState("islamabad");
  const [picked, setPicked] = useState<string[]>(SUGGESTED_COMPETITORS.slice(0, 4).map((c) => c.name));
  const [extra, setExtra] = useState("");
  const [custom, setCustom] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>(["most famous biryani places in Pakistan"]);
  const [engines, setEngines] = useState<EngineId[]>(["chatgpt", "gemini", "perplexity", "claude"]);
  const [models, setModels] = useState<Record<EngineId, string>>({ chatgpt: "gpt-5.1-search", gemini: "gemini-3-pro", perplexity: "sonar-pro", claude: "claude-sonnet-5" });
  const [mode, setMode] = useState<"free" | "byok">("byok");
  const [keyState, setKeyState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");

  const allPrompts = SUGGESTED_PROMPTS.flatMap((g) => g.items);
  const approved = allPrompts.filter((p) => !rejected.includes(p));
  const competitorList = [...picked, ...custom];
  const activeEngines = mode === "free" ? engines.slice(0, 2) : engines;
  const samples = mode === "free" ? [3, 3] : [3, 10];
  const perCall = mode === "free" ? 0 : COST_PER_CALL;
  const weekly = samples.map((s) => approved.length * activeEngines.length * s * perCall);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Enter in a single-line input advances, like a typeform; the key form handles its own Enter.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (e.key === "Enter" && t.tagName === "INPUT" && !t.closest("[data-own-enter]")) {
      e.preventDefault();
      next();
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      {/* progress */}
      <nav aria-label="Progress">
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-fill lg:hidden">
          <div className="h-full bg-ink" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="hidden flex-col gap-1 lg:flex">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                disabled={i > step}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-left text-small",
                  i === step ? "bg-lime font-medium text-lime-ink" : i < step ? "text-ink-2 hover:bg-fill" : "text-ink-3",
                )}
              >
                <span className={cn("grid size-5 place-items-center rounded-full border font-mono text-micro", i < step ? "border-ink bg-ink text-white" : "border-line-strong")}>
                  {i < step ? <Check size={12} aria-hidden /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        <p className="font-mono text-small tabular text-ink-3 lg:hidden">
          {step + 1}/{STEPS.length} · {STEPS[step]}
        </p>
      </nav>

      <div className="min-w-0" onKeyDown={onKeyDown}>
        <div className="rounded-lg border border-line bg-surface p-5 sm:p-8">
          {step === 0 && (
            <>
              <StepHeading n={1} title="Your brand">Use the name customers would type. Aliases catch nicknames and spelling variants in AI answers.</StepHeading>
              <div className="grid max-w-lg gap-4">
                <Field label="Business name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
                <Field label="Aliases" hint="Comma-separated. We match these exactly before anything fuzzier.">
                  <Input value={aliases} onChange={(e) => setAliases(e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <StepHeading n={2} title="Website">We&rsquo;ll read your site to suggest your category, location, facts and competitors. Only public pages, respecting robots.txt.</StepHeading>
              <div className="flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Website" className="flex-1"><Input value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" /></Field>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSiteRead("reading");
                    setTimeout(() => setSiteRead("done"), 900);
                  }}
                >
                  Read my site
                </Button>
              </div>
              <div className="mt-5 max-w-lg rounded-md border border-line bg-fill p-4 text-small" aria-live="polite">
                {siteRead === "idle" && <p className="text-ink-3">Nothing read yet. You can also skip this and fill things in yourself.</p>}
                {siteRead === "reading" && <p className="text-ink-2">Reading derabiryani.pk: home, menu, contact…</p>}
                {siteRead === "done" && (
                  <ul className="flex flex-col gap-1.5 text-ink-2">
                    <li><span className="text-ink-3">Category</span> Biryani restaurant</li>
                    <li><span className="text-ink-3">Address</span> Shop 14, G-9 Markaz, Islamabad</li>
                    <li><span className="text-ink-3">Hours</span> 12 pm – 1 am; Fri–Sun until 2 am</li>
                    <li><span className="text-ink-3">Found</span> 3 facts to verify, no JSON-LD, no llms.txt</li>
                  </ul>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <StepHeading n={3} title="Category and location">Questions are generated for this category and city. You can track more cities later.</StepHeading>
              <div className="grid max-w-lg gap-4">
                <Field label="Category"><Combobox options={CATEGORIES} value={category} onValueChange={setCategory} placeholder="Choose a category" searchPlaceholder="Search categories" /></Field>
                <Field label="City"><Combobox options={CITIES} value={city} onValueChange={setCity} placeholder="Choose a city" searchPlaceholder="Search cities" /></Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <StepHeading n={4} title="Competitors">Suggested from 40 sample answers to your category in Islamabad. Pick up to 5.</StepHeading>
              <ul className="flex max-w-xl flex-col divide-y divide-line rounded-md border border-line">
                {SUGGESTED_COMPETITORS.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <Checkbox
                      label={c.name}
                      checked={picked.includes(c.name)}
                      onCheckedChange={(v) => setPicked((p) => (v === true ? [...p, c.name] : p.filter((x) => x !== c.name)))}
                    />
                    <span className="text-right text-small text-ink-3">{c.why}</span>
                  </li>
                ))}
                {custom.map((c) => (
                  <li key={c} className="flex items-center justify-between gap-3 px-3 py-2.5 text-small">
                    {c}
                    <button type="button" aria-label={`Remove ${c}`} className="text-ink-3 hover:text-ink" onClick={() => setCustom((x) => x.filter((y) => y !== c))}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex max-w-xl gap-2" data-own-enter>
                <Field label="Add a competitor" className="flex-1">
                  <Input
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Name or website"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && extra.trim()) {
                        e.preventDefault();
                        setCustom((x) => [...x, extra.trim()]);
                        setExtra("");
                      }
                    }}
                  />
                </Field>
                <Button className="self-end" variant="secondary" onClick={() => { if (extra.trim()) { setCustom((x) => [...x, extra.trim()]); setExtra(""); } }}>
                  <Plus size={14} aria-hidden /> Add
                </Button>
              </div>
              <p className="mt-2 text-small text-ink-3">{competitorList.length} selected</p>
            </>
          )}

          {step === 4 && (
            <>
              <StepHeading n={5} title="Prompts to track">Suggested by reading your site and sample answers. {approved.length} of {allPrompts.length} approved; the free tier tracks up to 10.</StepHeading>
              <div className="flex flex-col gap-5">
                {SUGGESTED_PROMPTS.map((g) => (
                  <section key={g.intent} aria-label={g.intent}>
                    <p className="mb-2 flex items-center gap-2 text-micro uppercase text-ink-3">
                      {g.intent}
                      <span className="font-mono tabular normal-case">{g.items.filter((p) => !rejected.includes(p)).length}/{g.items.length}</span>
                    </p>
                    <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
                      {g.items.map((p) => {
                        const ok = !rejected.includes(p);
                        return (
                          <li key={p} className={cn("flex items-center gap-3 px-3 py-2", !ok && "bg-fill")}>
                            <span className={cn("min-w-0 flex-1 text-small", !ok && "text-ink-3 line-through")}>{p}</span>
                            <Button
                              size="sm"
                              variant={ok ? "ghost" : "secondary"}
                              aria-pressed={ok}
                              onClick={() => setRejected((r) => (ok ? [...r, p] : r.filter((x) => x !== p)))}
                            >
                              {ok ? "Reject" : "Approve"}
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <StepHeading n={6} title="Engines">Which assistants to ask. The free tier uses the first 2 you pick, on their low-cost models.</StepHeading>
              <ul className="flex max-w-xl flex-col divide-y divide-line rounded-md border border-line">
                {ENGINE_ORDER.map((e) => (
                  <li key={e} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <Checkbox
                      label={<EngineLabel engine={e} />}
                      aria-label={ENGINES[e].label}
                      checked={engines.includes(e)}
                      onCheckedChange={(v) => setEngines((x) => (v === true ? ENGINE_ORDER.filter((y) => x.includes(y) || y === e) : x.filter((y) => y !== e)))}
                    />
                    <Select
                      aria-label={`${ENGINES[e].label} model`}
                      className="w-full sm:w-60"
                      options={MODELS[e]}
                      value={models[e]}
                      onValueChange={(v) => setModels((m) => ({ ...m, [e]: v }))}
                      disabled={!engines.includes(e)}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 6 && (
            <div data-own-enter>
              <StepHeading n={7} title="Keys or free tier">Use the free tier now and add keys later, or add your own keys for all engines and adaptive sampling.</StepHeading>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v === "free" ? "free" : "byok")} aria-label="How to run checks" className="max-w-xl gap-3">
                <div className="rounded-md border border-line p-3">
                  <Radio value="free" label="Free tier, no keys" description="1 project, up to 10 prompts, weekly, 2 engines on low-cost models, 3 answers per prompt." />
                </div>
                <div className="rounded-md border border-line p-3">
                  <Radio value="byok" label="Use my own API keys" description="All engines, your models, 3 to 10 answers per prompt. You pay the providers directly." />
                </div>
              </RadioGroup>
              {mode === "byok" && (
                <div className="mt-6 max-w-xl">
                  <NewSecretInput
                    provider="OpenAI"
                    state={keyState}
                    onValidate={(k) => {
                      setKeyState("validating");
                      setTimeout(() => setKeyState(k.startsWith("sk-") ? "valid" : "invalid"), 800);
                    }}
                    error="OpenAI rejected this key (401). Check it was copied in full."
                  />
                  <p className="mt-3 text-small text-ink-3">Add Gemini, Perplexity and Anthropic keys now or later in Settings. Engines without a key show as &ldquo;blocked&rdquo;, never as zero.</p>
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <>
              <StepHeading n={8} title="Review and create" />
              <dl className="grid max-w-2xl gap-x-8 gap-y-3 text-small sm:grid-cols-[160px_minmax(0,1fr)]">
                <dt className="text-ink-3">Brand</dt>
                <dd>{name} <span className="text-ink-3">({aliases})</span></dd>
                <dt className="text-ink-3">Website</dt>
                <dd className="font-mono">{website}</dd>
                <dt className="text-ink-3">Category, city</dt>
                <dd>{CATEGORIES.find((c) => c.value === category)?.label}, {CITIES.find((c) => c.value === city)?.label}</dd>
                <dt className="text-ink-3">Competitors</dt>
                <dd className="flex flex-wrap gap-1.5">{competitorList.map((c) => <Badge key={c} tone="outline">{c}</Badge>)}</dd>
                <dt className="text-ink-3">Prompts</dt>
                <dd className="font-mono tabular">{approved.length} approved</dd>
                <dt className="text-ink-3">Engines</dt>
                <dd className="flex flex-wrap gap-x-4 gap-y-1">{activeEngines.map((e) => <EngineLabel key={e} engine={e} model={mode === "free" ? MODELS[e][1]!.value : models[e]} />)}</dd>
                <dt className="text-ink-3">Runs</dt>
                <dd>Weekly, Monday 03:00 PKT</dd>
              </dl>
              <div className="mt-6 max-w-2xl rounded-md border border-line bg-fill p-4">
                <p className="text-micro uppercase text-ink-3">Projected cost per week</p>
                {mode === "free" ? (
                  <p className="mt-1 text-body">$0 on the free tier: {approved.length > 10 ? "your first 10 prompts" : `${approved.length} prompts`} × 2 engines × 3 answers.</p>
                ) : (
                  <p className="mt-1 text-body">
                    <span className="font-mono tabular">${weekly[0]!.toFixed(2)} to ${weekly[1]!.toFixed(2)}</span>{" "}
                    <span className="text-ink-2">paid to the providers on your keys</span>
                  </p>
                )}
                <p className="mt-1 text-small text-ink-3">
                  {approved.length} prompts × {activeEngines.length} engines × {samples[0]}{samples[1] !== samples[0] ? ` to ${samples[1]}` : ""} answers. Identical public prompts shared with other users usually cost less.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" onClick={next} kbd="↵">Continue</Button>
          ) : (
            <Button variant="primary" asChild><Link href="/design/dashboard">Create project and run first check</Link></Button>
          )}
        </div>
      </div>
    </div>
  );
}
