# Teleprompter Online Gratis

Free browser-based teleprompter targeting the keyword cluster around
**"teleprompter online gratis"** (ES) and **"online teleprompter"** (EN).
Static Astro site with a single React island — the tool itself.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
npm run preview
```

## Before deploying

1. **Set your real domain** in `astro.config.mjs` (`site:`) — it drives
   canonical URLs, hreflang and the sitemap.
2. Update the `Sitemap:` line in `public/robots.txt`.
3. Deploy `dist/` as static files (Coolify: static site, or any nginx/Caddy).
   No server runtime needed.
4. Camera recording requires **HTTPS** (getUserMedia is blocked on plain HTTP,
   localhost excepted).

## Architecture

- `src/pages/index.astro` — Spanish page (root = main market, 800/mo ES + LATAM).
- `src/pages/en/index.astro` — English page. Adding `pt` = copy a page +
  extend `src/i18n/ui.ts` + add the hreflang path in `Layout.astro`.
- `src/components/Teleprompter.tsx` — the composition root for the hydrated
  `client:load` island.
- `src/features/teleprompter/` — local domain types, persistence, presentation
  engine, and focused browser API hooks. Everything remains client-side:
  `requestAnimationFrame` scroll, Fullscreen API, `getUserMedia` +
  `MediaRecorder` (video never leaves the device), localStorage persistence,
  and Wake Lock on supported devices.
- `src/components/teleprompter/` — editor and presentation UI sections.
- Fonts self-hosted via Fontsource (no external font CDN → better LCP).
- JSON-LD: `SoftwareApplication` + `FAQPage` on both pages.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run test:e2e
```

## Launch checklist (the ~3-5 backlinks that matter at KD 2)

- [ ] Product Hunt launch
- [ ] Show HN / r/webdev / r/SideProject post — angle: "no signup, recording
      stays 100% local"
- [ ] 2–3 free-tool directories
- [ ] dev.to / blog write-up of the MediaRecorder implementation
- [ ] Google Search Console: submit sitemap, request indexing for both URLs

## v2 ideas (monetization / differentiation)

- Phone-as-remote-control via WebRTC data channel (BIGVU charges for this)
- Saved scripts across devices (accounts → your Better Auth + Drizzle stack)
- Voice-follow scrolling (Web Speech API keeps pace with the reader)
- `pt` locale for Brazil
- Swap React for Preact via `@astrojs/preact` to cut ~150 KB off the island
  (API-compatible for this component)
