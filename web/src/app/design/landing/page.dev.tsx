import type { Metadata } from "next";
import Link from "next/link";
import { LineCI } from "@/components/charts/line-ci";
import { RankTable } from "@/components/charts/rank-table";
import { AnswerCard } from "@/components/ui/answer-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { Delta } from "@/components/ui/delta";
import { EngineLabel } from "@/components/ui/engine-label";
import { Field, Input } from "@/components/ui/input";
import { IntervalValue, formatPct } from "@/components/ui/interval-value";
import {
  actions,
  answers,
  brandSeries,
  competitorSeries,
  competitors,
  falseFacts,
  questions,
  wilson,
} from "@/lib/mock";
import { ENGINE_ORDER, ENGINES } from "@/lib/palette";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Recommendr: see if ChatGPT, Gemini, Perplexity and Claude recommend your business",
  description:
    "Ask ChatGPT about your industry. See if it mentions you. Free and open source. Bring your own API keys, or self-host it.",
};

const GITHUB = "https://github.com/saadhtiwana/recommendr";

const FAQ: { q: string; a: string }[] = [
  {
    q: "Why do results vary from one check to the next?",
    a: "AI assistants don't give the same answer twice. Ask ChatGPT the same question 10 times and the list of businesses changes. So we ask each question several times on each assistant and report how often you appeared, with a range that shows how sure we are. Three answers out of ten is a weak signal; thirty-three out of a hundred is a much stronger one.",
  },
  {
    q: "Do you scrape ChatGPT?",
    a: "No. We use the official APIs of OpenAI, Google, Perplexity and Anthropic with web search turned on. That's legal, repeatable and auditable, but it isn't identical to what a signed-in person sees in the ChatGPT app: the app can personalise answers using memory and location. We say this in the product and measure how close the two are.",
  },
  {
    q: "What happens to my API keys?",
    a: "They're encrypted (AES-256-GCM, a separate key per secret) the moment you save them and are never shown again. We only display the provider, the last four characters, when you added it and when it was last used. They're never logged or sent to error reporting. You can revoke or replace a key at any time.",
  },
  {
    q: "Is my data shared with other users?",
    a: "Public questions that several users ask (like 'best biryani in Islamabad') are sampled once a day and the raw AI answers are shared, which cuts everyone's costs. Your own brand, competitors, verified facts and private questions are never shared. You can turn sharing off.",
  },
  {
    q: "How much does it cost to use my own keys?",
    a: "You pay the AI providers directly at their prices. A typical small business tracking 10 questions weekly on all four assistants spends roughly $1 to $3 a month. We show the projected cost before every run, and you can set a monthly cap per key.",
  },
  {
    q: "What does the free tier include?",
    a: "One project, up to 10 questions, checked weekly on 2 assistants using low-cost models, 3 answers per question. No API keys needed. If the shared monthly budget for free checks runs out, free checks pause until the 1st and we tell you.",
  },
  {
    q: "Can it change what ChatGPT says about me?",
    a: "Not directly, and nobody honest can promise that. Recommendr shows which sources the assistants rely on, what they get wrong, and gives you ready-to-use fixes: FAQ content, structured data, llms.txt, outreach drafts. Then it measures whether things moved, with the same statistics.",
  },
];

// Structured data for crawlers and AI assistants: the product is about AI visibility, so the
// landing page has to be exemplary here.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://recommendr.app/#org",
      name: "Recommendr",
      url: "https://recommendr.app",
      logo: "https://recommendr.app/brand/logo-mark.svg",
      sameAs: [GITHUB],
    },
    {
      "@type": "SoftwareApplication",
      name: "Recommendr",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Docker",
      description:
        "Free, open-source AI search visibility: see whether ChatGPT, Gemini, Perplexity and Claude recommend your business, who they recommend instead, and how to fix it.",
      license: "https://www.gnu.org/licenses/agpl-3.0.html",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://recommendr.app/#org" },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

const restaurantJsonLd = `{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Dera Biryani House",
  "servesCuisine": ["Pakistani", "Sindhi biryani"],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Shop 14, G-9 Markaz",
    "addressLocality": "Islamabad",
    "addressCountry": "PK"
  },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday"],
      "opens": "12:00", "closes": "01:00" },
    { "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Friday","Saturday","Sunday"],
      "opens": "12:00", "closes": "02:00" }
  ],
  "amenityFeature": {
    "@type": "LocationFeatureSpecification",
    "name": "Private family rooms", "value": true
  }
}`;

const PLANS: { label: string; free: string; byok: string; self: string }[] = [
  { label: "Price", free: "$0", byok: "$0 (you pay providers at cost)", self: "$0" },
  { label: "API keys", free: "None needed", byok: "Your OpenAI, Gemini, Perplexity, Anthropic keys", self: "Your keys" },
  { label: "Projects", free: "1", byok: "Unlimited (fair use)", self: "Unlimited" },
  { label: "Questions", free: "Up to 10", byok: "You choose", self: "You choose" },
  { label: "Checks", free: "Weekly", byok: "Weekly; daily optional, cost shown first", self: "Your schedule" },
  { label: "Assistants", free: "2, low-cost models", byok: "All 4, your choice of model", self: "All 4" },
  { label: "Answers per question", free: "3", byok: "3 to 10, adaptive", self: "Configurable" },
  { label: "Limits", free: "Pauses if the monthly free budget runs out", byok: "Optional monthly cap per key", self: "None" },
];

function SectionHeading({ id, kicker, children }: { id: string; kicker: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl">
      <p className="text-micro uppercase text-ink-3">{kicker}</p>
      <h2 id={id} className="mt-2 font-serif text-h2 text-ink sm:text-h1">
        {children}
      </h2>
    </div>
  );
}

export default function LandingPreview() {
  const proof = wilson(3, 10);
  const small = wilson(3, 10);
  const large = wilson(33, 100);
  const fact = falseFacts[0]!;
  const action = actions[1]!;
  const heroAnswers = [answers[0]!, answers[1]!];

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5 md:px-8">
          <Link href="/design/landing" aria-label="Recommendr home" className="shrink-0">
            <Logo variant="full" height={24} />
          </Link>
          <nav aria-label="Main" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-5 text-small text-ink-2">
              <li><a className="hover:text-ink" href="#how">How it works</a></li>
              <li><a className="hover:text-ink" href="#honest">Honest numbers</a></li>
              <li><a className="hover:text-ink" href="#open-source">Open source</a></li>
              <li><a className="hover:text-ink" href="#pricing">Pricing</a></li>
              <li><a className="hover:text-ink" href="#faq">FAQ</a></li>
              <li><a className="hover:text-ink" href={GITHUB}>GitHub</a></li>
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild><Link href="/design/dashboard">Sign in</Link></Button>
            <Button variant="primary" asChild leavesPage><Link href="/design/onboarding">Start free</Link></Button>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------------------------------------------ hero */}
        <section aria-labelledby="hero-title" className="border-b border-line">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:py-20">
            <div className="min-w-0">
              <h1 id="hero-title" className="font-serif text-h1 text-ink sm:text-display">
                Ask ChatGPT about your industry. See if it{" "}
                <span className="bg-lime px-1 text-lime-ink [-webkit-box-decoration-break:clone] [box-decoration-break:clone]">mentions you.</span>
              </h1>
              <p className="mt-5 max-w-xl text-body text-ink-2">
                Recommendr asks ChatGPT, Gemini, Perplexity and Claude the questions your customers ask, many times over,
                and shows how often you come up, who gets recommended instead, and what to fix.
              </p>

              <form action="/design/dashboard" className="mt-8 max-w-xl rounded-lg border border-line bg-surface p-4 sm:p-5">
                <p className="text-small font-medium">Free instant check</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="Business name">
                    <Input name="name" placeholder="Dera Biryani House" autoComplete="organization" />
                  </Field>
                  <Field label="Category">
                    <Input name="category" placeholder="Biryani restaurant" />
                  </Field>
                  <Field label="City">
                    <Input name="city" placeholder="Islamabad" autoComplete="address-level2" />
                  </Field>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* The one lime hero CTA on this page (Highlighter rule 2). */}
                  <Button type="submit" variant="hero" size="lg">Run the free check</Button>
                  <p className="text-small text-ink-3">No sign-up. 4 AI assistants. About 60 seconds.</p>
                </div>
              </form>
            </div>

            <aside aria-label="Sample result" className="min-w-0">
              <div className="rounded-lg border border-line bg-surface p-4 sm:p-5">
                <p className="text-micro uppercase text-ink-3">Sample result · best biryani in Islamabad</p>
                <p className="mt-2 text-body text-ink">
                  We asked ChatGPT &lsquo;best biryani in Islamabad&rsquo; 10 times. You appeared 3 times. Your top competitor appeared 8.
                </p>
                <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-line pt-4">
                  <div>
                    <p className="text-micro uppercase text-ink-3">You · Dera Biryani House</p>
                    <IntervalValue p={proof.p} lo={proof.lo} hi={proof.hi} n={10} size="lg" />
                  </div>
                  <div>
                    <p className="text-micro uppercase text-ink-3">Shahi Handi</p>
                    <IntervalValue p={wilson(8, 10).p} lo={wilson(8, 10).lo} hi={wilson(8, 10).hi} n={10} size="lg" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {heroAnswers.map((a) => (
                  <AnswerCard key={a.id} answer={a} competitors={competitors} compact />
                ))}
              </div>
            </aside>
          </div>
        </section>

        {/* ------------------------------------------------------------------ how it works */}
        <section id="how" aria-labelledby="how-title" className="border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 lg:py-24">
            <SectionHeading id="how-title" kicker="How it works">Three steps, all visible.</SectionHeading>

            <ol className="mt-12 flex flex-col divide-y divide-line border-y border-line">
              <li className="grid gap-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                <div>
                  <p className="font-mono text-small tabular text-ink-3">01</p>
                  <h3 className="mt-2 text-h3">Pick the questions your customers ask</h3>
                  <p className="mt-2 max-w-md text-ink-2">
                    We suggest 10 to 30 questions from your site, category and city, grouped by intent. You keep the ones that
                    matter and can mark any of them private.
                  </p>
                </div>
                <div className="min-w-0">
                  <RankTable rows={questions.slice(0, 5)} maxHeight="20rem" />
                </div>
              </li>

              <li className="grid gap-6 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <div className="min-w-0 lg:order-1">
                  <p className="font-mono text-small tabular text-ink-3">02</p>
                  <h3 className="mt-2 text-h3">We ask four assistants, several times each</h3>
                  <p className="mt-2 max-w-md text-ink-2">
                    Same question, 3 to 10 answers per assistant, with web search on. Every answer is kept, with the model
                    and the time, so you can read exactly what was said.
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label="Assistants">
                    {ENGINE_ORDER.map((e) => (
                      <li key={e}><EngineLabel engine={e} /></li>
                    ))}
                  </ul>
                </div>
                <div className="grid min-w-0 gap-4 md:grid-cols-2">
                  <AnswerCard answer={answers[2]!} competitors={competitors} compact />
                  <AnswerCard answer={answers[3]!} competitors={competitors} compact />
                </div>
              </li>

              <li className="grid gap-6 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                <div>
                  <p className="font-mono text-small tabular text-ink-3">03</p>
                  <h3 className="mt-2 text-h3">Fix what&rsquo;s missing or wrong</h3>
                  <p className="mt-2 max-w-md text-ink-2">
                    A ranked list of fixes with the evidence behind each one, and the fix itself, ready to paste.
                  </p>
                </div>
                <div className="min-w-0 rounded-lg border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="lime">Impact: {action.impact}</Badge>
                    <Badge tone="outline">Effort: {action.effort}</Badge>
                    <span className="text-small text-ink-3">{action.expectedLift}</span>
                  </div>
                  <p className="mt-2 font-medium">{action.title}</p>
                  <p className="mt-1 text-small text-ink-3">{action.evidence}</p>
                  <CodeBlock className="mt-3" code={restaurantJsonLd.split("\n").slice(0, 12).join("\n") + "\n  …"} language="json" filename="restaurant.jsonld" copyable={false} />
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------------------ honest numbers */}
        <section id="honest" aria-labelledby="honest-title" className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:py-24">
            <div>
              <SectionHeading id="honest-title" kicker="Honest numbers">AI answers vary. We show by how much.</SectionHeading>
              <p className="mt-5 max-w-lg text-ink-2">
                Every percentage comes with a range. The range shrinks as we collect more answers, and we only call
                something a change when it&rsquo;s bigger than the noise.
              </p>

              <dl className="mt-8 divide-y divide-line border-y border-line">
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4">
                  <dt className="text-small text-ink-2">3 of 10 answers</dt>
                  <dd className="text-right">
                    <span className="font-mono text-data tabular">{formatPct(small.p)}</span>{" "}
                    <span className="font-mono text-data tabular text-ink-3">
                      ({formatPct(small.lo)} to {formatPct(small.hi)})
                    </span>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4">
                  <dt className="text-small text-ink-2">33 of 100 answers</dt>
                  <dd className="text-right">
                    <IntervalValue p={large.p} lo={large.lo} hi={large.hi} n={100} />
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4">
                  <dt className="text-small text-ink-2">A real change: ChatGPT, week on week</dt>
                  <dd className="text-right"><Delta value={15.7} significant /></dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4">
                  <dt className="text-small text-ink-2">Probably noise: Gemini, week on week</dt>
                  <dd className="text-right"><Delta value={1.6} significant={false} /></dd>
                </div>
              </dl>
              <p className="mt-3 text-small text-ink-3">
                Changes that aren&rsquo;t statistically significant are shown in grey, so you don&rsquo;t react to noise.
              </p>
            </div>

            <figure className="min-w-0 rounded-lg border border-line bg-bg p-4 sm:p-5">
              <figcaption className="mb-3 text-small text-ink-2">
                Your visibility (thick line) with its 95% range (shaded), against Shahi Handi. 12 weeks, about 590 answers
                a week.
              </figcaption>
              <LineCI
                brand={brandSeries}
                brandLabel="You"
                series={[{ id: "c_shahi", label: "Shahi Handi", color: "teal", points: competitorSeries.c_shahi!, significant: false }]}
                height={280}
                title="Visibility over 12 weeks with confidence band"
              />
            </figure>
          </div>
        </section>

        {/* ------------------------------------------------------------------ false facts + fix */}
        <section aria-labelledby="facts-title" className="border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 lg:py-24">
            <SectionHeading id="facts-title" kicker="False facts">Catch what AI gets wrong about you.</SectionHeading>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <article aria-label="False fact example" className="rounded-lg border border-line bg-surface">
                <div className="grid sm:grid-cols-2">
                  <div className="border-b border-line p-4 sm:border-b-0 sm:border-r">
                    <p className="text-micro uppercase text-down">AI says</p>
                    <p className="mt-2 font-serif text-h3">&ldquo;{fact.claim}&rdquo;</p>
                  </div>
                  <div className="p-4">
                    <p className="text-micro uppercase text-ink-3">Your verified fact</p>
                    <p className="mt-2 text-ink">{fact.truth}</p>
                  </div>
                </div>
                <dl className="grid gap-3 border-t border-line p-4 text-small sm:grid-cols-3">
                  <div>
                    <dt className="text-ink-3">Said by</dt>
                    <dd className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {fact.engines.map((e) => <EngineLabel key={e} engine={e} />)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">How often</dt>
                    <dd className="mt-1 font-mono tabular">{fact.seen} of {fact.of} answers</dd>
                  </div>
                  <div>
                    <dt className="text-ink-3">Where it came from</dt>
                    <dd className="mt-1 font-mono">{fact.source}</dd>
                  </div>
                </dl>
              </article>

              <article aria-label="Fix example" className="min-w-0">
                <h3 className="text-h3">The fix: publish your real hours and rooms as structured data</h3>
                <p className="mt-2 text-ink-2">
                  Generated from your verified facts. Paste it into your site&rsquo;s head, then we re-check the same
                  questions and show whether the false claim stops.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="lime">Impact: High</Badge>
                  <Badge tone="outline">Effort: Low</Badge>
                  <Badge tone="outline">Fixes 2 false facts</Badge>
                </div>
                <CodeBlock className="mt-4" code={restaurantJsonLd} language="json" filename="restaurant.jsonld" />
              </article>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ open source */}
        <section id="open-source" aria-labelledby="oss-title" className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-2 lg:py-24">
            <div>
              <SectionHeading id="oss-title" kicker="Open source">Free and open source. Bring your own API keys, or self-host it.</SectionHeading>
              <ul className="mt-6 flex flex-col gap-3 text-ink-2">
                <li>
                  <span className="font-medium text-ink">AGPL-3.0.</span> Read every line that touches your data, including how
                  the statistics are computed.
                </li>
                <li>
                  <span className="font-medium text-ink">Your keys, your costs.</span> Pay OpenAI, Google, Perplexity and
                  Anthropic directly. Keys are encrypted and never shown again.
                </li>
                <li>
                  <span className="font-medium text-ink">Self-host in five minutes.</span> Postgres, the API, a worker and the
                  web app in one Docker Compose file.
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="ink" asChild leavesPage><a href={GITHUB}>View on GitHub</a></Button>
                <Button variant="secondary" asChild leavesPage><a href={`${GITHUB}/blob/main/docs/self-hosting.md`}>Self-hosting guide</a></Button>
              </div>
            </div>
            <div className="min-w-0">
              <CodeBlock
                language="bash"
                filename="terminal"
                code={`git clone ${GITHUB}.git && cd recommendr\ncp backend/.env.example .env   # set KEY_ENCRYPTION_KEY, SESSION_SECRET\ndocker compose up -d\nopen http://localhost:3000`}
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ pricing */}
        <section id="pricing" aria-labelledby="pricing-title" className="border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 lg:py-24">
            <SectionHeading id="pricing-title" kicker="Pricing">Free, three ways.</SectionHeading>
            <div className="mt-10 overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full min-w-[640px] border-collapse text-small">
                <caption className="sr-only">Plan comparison</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="w-[22%] p-4 text-left font-normal text-ink-3"><span className="sr-only">Feature</span></th>
                    <th scope="col" className="p-4 text-left align-top">
                      <span className="block text-h4">Free</span>
                      <span className="block font-normal text-ink-3">No keys</span>
                    </th>
                    <th scope="col" className="bg-lime-soft p-4 text-left align-top text-lime-ink">
                      <span className="block text-h4">Free with your own keys</span>
                      <span className="block font-normal text-ink-3">Most people pick this</span>
                    </th>
                    <th scope="col" className="p-4 text-left align-top">
                      <span className="block text-h4">Self-hosted</span>
                      <span className="block font-normal text-ink-3">Your server</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((row) => (
                    <tr key={row.label} className="border-b border-line last:border-b-0">
                      <th scope="row" className="p-4 text-left font-normal text-ink-3">{row.label}</th>
                      <td className="p-4">{row.free}</td>
                      <td className="bg-lime-soft/60 p-4 text-lime-ink">{row.byok}</td>
                      <td className="p-4">{row.self}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-4" />
                    <td className="p-4"><Button variant="secondary" asChild><Link href="/design/onboarding">Start free</Link></Button></td>
                    <td className="bg-lime-soft/60 p-4 text-lime-ink"><Button variant="primary" asChild leavesPage><Link href="/design/onboarding">Add your keys</Link></Button></td>
                    <td className="p-4"><Button variant="secondary" asChild><a href={`${GITHUB}/blob/main/docs/self-hosting.md`}>Read the guide</a></Button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-small text-ink-3">
              A typical small business on its own keys: 10 questions, weekly, 4 assistants ≈ $1 to $3 a month, paid to the
              providers.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------ FAQ */}
        <section id="faq" aria-labelledby="faq-title">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:py-24">
            <SectionHeading id="faq-title" kicker="FAQ">Questions people actually ask.</SectionHeading>
            <div className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium focus-visible:focus-ring [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden className="font-mono text-ink-3 group-open:hidden">+</span>
                    <span aria-hidden className="hidden font-mono text-ink-3 group-open:inline">−</span>
                  </summary>
                  <p className="mt-3 max-w-prose text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-12 md:px-8 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo variant="full" height={24} />
            <p className="mt-3 max-w-sm text-small text-ink-3">
              Open source under AGPL-3.0. Not affiliated with OpenAI, Google, Perplexity or Anthropic.
            </p>
          </div>
          <nav aria-label="Product">
            <p className="text-micro uppercase text-ink-3">Product</p>
            <ul className="mt-3 flex flex-col gap-2 text-small text-ink-2">
              <li><a className="hover:text-ink" href="#how">How it works</a></li>
              <li><a className="hover:text-ink" href="#pricing">Pricing</a></li>
              <li><a className="hover:text-ink" href="#faq">FAQ</a></li>
              <li><a className="hover:text-ink" href="/llms.txt">llms.txt</a></li>
            </ul>
          </nav>
          <nav aria-label="Open source">
            <p className="text-micro uppercase text-ink-3">Open source</p>
            <ul className="mt-3 flex flex-col gap-2 text-small text-ink-2">
              <li><a className="hover:text-ink" href={GITHUB}>GitHub</a></li>
              <li><a className="hover:text-ink" href={`${GITHUB}/blob/main/docs/self-hosting.md`}>Self-hosting</a></li>
              <li><a className="hover:text-ink" href={`${GITHUB}/blob/main/docs/system-design.md`}>System design</a></li>
              <li><a className="hover:text-ink" href={`${GITHUB}/blob/main/SECURITY.md`}>Security</a></li>
            </ul>
          </nav>
        </div>
        <p className="mx-auto max-w-[1200px] px-5 pb-8 text-small text-ink-3 md:px-8">
          Assistants sampled: {ENGINE_ORDER.map((e) => ENGINES[e].label).join(", ")}.
        </p>
      </footer>
    </div>
  );
}
