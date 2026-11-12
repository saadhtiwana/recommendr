# web

Next.js (App Router) + TypeScript (strict) + Tailwind CSS, managed with pnpm.

- **Marketing pages:** statically rendered, semantic HTML, JSON-LD, llms.txt: exemplary for crawlers and AI assistants (phase 8).
- **Dashboard:** typed API client generated from the backend's OpenAPI schema (phase 8).
- **Design system:** defined in phase 1b (design rules in CONTRIBUTING.md).

```sh
pnpm install
pnpm lint && pnpm build
pnpm dev            # http://localhost:3000
```

Configuration: [.env.example](.env.example).
