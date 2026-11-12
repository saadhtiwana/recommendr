import type { Metadata } from "next";
import { FAQ } from "./_faq";
import { Landing } from "./_landing";

export const metadata: Metadata = {
  title: "Recommendr: see if AI assistants recommend your business",
  description:
    "Free, open-source AI search visibility. Ask ChatGPT, Gemini, Perplexity and Claude what your customers ask, see if they mention you, and fix what they get wrong.",
};

const GITHUB = "https://github.com/saadhtiwana/recommendr";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Recommendr",
      url: "https://recommendr.app",
      logo: "https://recommendr.app/brand/logo-mark.svg",
      sameAs: [GITHUB],
    },
    {
      "@type": "SoftwareApplication",
      name: "Recommendr",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      license: "https://www.gnu.org/licenses/agpl-3.0.html",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: "Shows businesses whether AI assistants recommend them, who gets recommended instead and why, and generates the fixes.",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ],
};

export default function LandingPreview() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Landing />
    </>
  );
}
