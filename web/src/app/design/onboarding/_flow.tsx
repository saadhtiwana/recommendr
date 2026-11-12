"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EngineLogo } from "@/components/brand/engine-logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { ENGINE_ORDER, ENGINES, type EngineId } from "@/lib/palette";

const STEPS = ["Business", "Competitors", "Questions", "Engines & keys"] as const;

const SUGGESTED_COMPETITORS = ["Fulton Ave Pizza", "Prospect Pie Co.", "Bleecker Street Slice", "Grand Army Pizzeria"];
const SUGGESTED_QUESTIONS = [
  "best pizza in Brooklyn",
  "classic New York slice near Park Slope",
  "late night pizza delivery Brooklyn",
  "pizza catering for an office party Brooklyn",
  "gluten-free pizza near me Brooklyn",
];
const KEY_PROVIDER: Record<EngineId, string> = { chatgpt: "OpenAI", gemini: "Google", perplexity: "Perplexity", claude: "Anthropic" };

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [competitors, setCompetitors] = useState(SUGGESTED_COMPETITORS);
  const [picked, setPicked] = useState(SUGGESTED_COMPETITORS.slice(0, 3));
  const [extra, setExtra] = useState("");
  const [questions, setQuestions] = useState(SUGGESTED_QUESTIONS);
  const [engines, setEngines] = useState<EngineId[]>(["chatgpt", "perplexity"]);

  const addCompetitor = () => {
    const v = extra.trim();
    if (!v) return;
    setCompetitors((c) => [...c, v]);
    setPicked((p) => [...p, v]);
    setExtra("");
  };

  return (
    <div className="mx-auto max-w-xl">
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={cn("block h-1 rounded-full", i <= step ? "bg-ink" : "bg-line-strong")} />
            <span className={cn("mt-2 hidden text-small sm:block", i === step ? "font-medium text-ink" : "text-ink-3")}>{label}</span>
          </li>
        ))}
      </ol>

      <div className="rounded-lg bg-surface p-6 sm:p-8">
        <h2 className="mb-6 text-h3 font-medium text-ink">{STEPS[step]}</h2>

        {step === 0 && (
          <div className="grid gap-4">
            <Field label="Business name">
              <Input placeholder="Corner Slice Pizza" />
            </Field>
            <Field label="Website">
              <Input placeholder="cornerslice.nyc" inputMode="url" />
            </Field>
            <Field label="City">
              <Input placeholder="Brooklyn, NY" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <>
            <ul className="divide-y divide-line">
              {competitors.map((c) => (
                <li key={c} className="py-2.5">
                  <Checkbox
                    label={c}
                    checked={picked.includes(c)}
                    onCheckedChange={(v) => setPicked((p) => (v === true ? [...p, c] : p.filter((x) => x !== c)))}
                  />
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addCompetitor();
              }}
            >
              <Input aria-label="Add a competitor" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Add a competitor" className="h-9" />
              <Button type="submit" variant="secondary">
                <Plus size={14} aria-hidden /> Add
              </Button>
            </form>
          </>
        )}

        {step === 2 && (
          <ul className="divide-y divide-line">
            {questions.map((q) => (
              <li key={q} className="flex items-center justify-between gap-3 py-2.5 text-small text-ink">
                {q}
                <button
                  type="button"
                  aria-label={`Remove ${q}`}
                  className="rounded-sm p-1 text-ink-3 hover:bg-fill hover:text-ink focus-visible:focus-ring"
                  onClick={() => setQuestions((x) => x.filter((y) => y !== q))}
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {step === 3 && (
          <ul className="divide-y divide-line">
            {ENGINE_ORDER.map((e) => {
              const on = engines.includes(e);
              return (
                <li key={e} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <Checkbox
                    label={
                      <span className="inline-flex items-center gap-2">
                        <EngineLogo engine={e} size={16} /> {ENGINES[e].label}
                      </span>
                    }
                    checked={on}
                    onCheckedChange={(v) => setEngines((x) => (v === true ? [...x, e] : x.filter((y) => y !== e)))}
                  />
                  <Input
                    type="password"
                    aria-label={`${KEY_PROVIDER[e]} API key`}
                    placeholder={`${KEY_PROVIDER[e]} API key`}
                    disabled={!on}
                    className="h-9 sm:ml-auto sm:w-56"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button variant="accent" asChild>
            <Link href="/design/dashboard">Create project</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
