# Project Structure

Annotated directory tree for the actual, current state of the repository. See [ARCHITECTURE.md](ARCHITECTURE.md) for how these pieces fit together, and [IMAGE_PIPELINE.md](IMAGE_PIPELINE.md) for everything under `public/images/` and `raw-photos/`.

```
jared-mananguit-portfolio/
├── index.html                 # Vite entry HTML — static SEO/OG defaults, favicon, font links
├── vite.config.ts             # Build config: plugins, path alias, vendor chunk splitting
├── vercel.json                # Deployment config: build command + SPA rewrite rule
├── tsconfig.json               # TypeScript compiler config (strict-ish, no emit)
├── package.json
│
├── src/
│   ├── main.tsx                # React root — mounts <App /> into #root
│   ├── App.tsx                 # Router setup, route table, lazy-loaded pages
│   ├── index.css               # Tailwind entry + theme tokens + two hand-written utilities
│   ├── data.ts                 # Destination metadata (id, title, description) — see COLLECTIONS.md
│   │
│   ├── data/
│   │   ├── hero.ts             # Homepage hero image path + responsive focal points
│   │   └── socials.ts          # Social platform config — single source for every social icon
│   │
│   ├── lib/
│   │   ├── gallery.ts          # Builds image URLs, reads manifest.json, fallback probing
│   │   └── seo.ts              # Site-wide constants: SITE_URL, default title/description/OG image
│   │
│   ├── hooks/
│   │   ├── useGalleryImages.ts # React hook wrapping lib/gallery.ts's loader
│   │   └── useSEO.ts           # Sets document title + meta/OG/Twitter tags + canonical per route
│   │
│   ├── components/
│   │   ├── Navbar.tsx           # Desktop nav + mobile drawer, scroll-aware background
│   │   ├── Footer.tsx           # Site footer with social links
│   │   ├── HeroSection.tsx      # Homepage full-bleed hero banner
│   │   ├── CollectionsHero.tsx  # Collections page hero — auto-rotates each destination's cover.jpg
│   │   ├── DestinationGrid.tsx  # Card grid used on Home and Collections
│   │   ├── GalleryMasonry.tsx   # Masonry photo grid + opens Lightbox
│   │   ├── Lightbox.tsx         # Full-screen photo viewer (keyboard + click nav)
│   │   ├── SafeImage.tsx        # <img> that degrades to a placeholder instead of a broken icon
│   │   ├── CoverImage.tsx       # SafeImage pre-wired to a destination's cover.jpg
│   │   ├── ScrollToTop.tsx      # Resets scroll position on route change
│   │   ├── ThemeProvider.tsx    # Light/dark theme context + localStorage persistence
│   │   └── common/
│   │       └── SocialLinks.tsx  # Renders src/data/socials.ts — used in 4+ places
│   │
│   └── pages/
│       ├── Home.tsx               # "/"
│       ├── DestinationsIndex.tsx  # "/collections"
│       ├── DestinationGallery.tsx # "/collections/:id"
│       ├── Contact.tsx            # "/contact"
│       ├── Gear.tsx               # "/gear" — placeholder, see GEAR_SYSTEM.md
│       └── NotFound.tsx           # catch-all "*" route
│
├── public/                     # Served as-is at the site root
│   ├── favicon.svg, favicon.png, apple-touch-icon.png, icon-192.png, icon-512.png
│   ├── site.webmanifest
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── og-image.jpg            # Social share preview image (1200×630)
│   └── images/
│       ├── hero/
│       │   └── homepage-hero.jpg
│       └── <country>/          # japan, taiwan, bali, thailand, uae (see COLLECTIONS.md)
│           ├── cover.jpg
│           ├── card.jpg        # optional, see CARD.txt below
│           ├── manifest.json   # { "count": N } — tells the site how many photos exist
│           ├── 001.jpg … NNN.jpg          # full-size gallery photos (lightbox quality)
│           └── 001-thumb.jpg … NNN-thumb.jpg  # smaller variants for the masonry grid
│
├── raw-photos/                 # Gitignored. Local staging area — camera-original dumps
│   └── <country>/
│       ├── (any filenames, any of .jpg/.jpeg/.png/.webp)
│       ├── metadata.json       # written by the pipeline: original → new filename, scores
│       ├── COVER.txt           # optional: force a specific cover instead of auto-selection
│       └── CARD.txt            # optional: separate portrait image for the destination cards (card.jpg)
│
├── scripts/
│   └── import-images/
│       ├── run.mjs             # Pipeline entry point (npm run import-images)
│       ├── scoring.mjs         # Offline cover-image scoring heuristic
│       └── hash.mjs            # Perceptual hashing for duplicate detection
│
├── docs/                       # You are here
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── PROJECT_STRUCTURE.md
│   ├── IMAGE_PIPELINE.md
│   ├── COLLECTIONS.md
│   ├── GEAR_SYSTEM.md
│   ├── FILM_SYSTEM.md
│   ├── ROADMAP.md
│   ├── STYLE_GUIDE.md
│   └── CONTRIBUTING.md
│
└── assets/.aistudio/            # Managed by the Google AI Studio host environment — not part of
                                  # the website; leave alone
```

## Notes on things that don't exist (yet, or anymore)

A few structural details worth being explicit about, since it's easy to assume otherwise:

- **No `app/` directory, no `next.config.*`.** This is a Vite SPA, not Next.js. See [ARCHITECTURE.md](ARCHITECTURE.md#why-vite-not-nextjs) for why that's actually a good fit here.
- **No `gallery/` subfolder inside a country folder.** Photos live flat: `public/images/japan/001.jpg`, not `public/images/japan/gallery/001.jpg`. This matches how `src/lib/gallery.ts` resolves URLs — one path segment, not two.
- **No `public/images/gear/`, `cameras/`, `lenses/`, or `film/` folders exist yet.** The gear/lens/film archive is a designed-but-unbuilt feature — see [GEAR_SYSTEM.md](GEAR_SYSTEM.md), [FILM_SYSTEM.md](FILM_SYSTEM.md), and [ROADMAP.md](ROADMAP.md).
- **No `src/pages/About.tsx`.** There was one; it was intentionally removed. See [COLLECTIONS.md](COLLECTIONS.md) and the note in ROADMAP.md if it's ever worth reviving.
- **No `pnpm-lock.yaml`.** This project uses npm (`package-lock.json`).
