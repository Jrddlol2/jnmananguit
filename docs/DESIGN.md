# Design Philosophy

> "Let the photographs tell the story."

This document is the *why* behind the interface. For the *how* (implementation details, component conventions), see [STYLE_GUIDE.md](STYLE_GUIDE.md).

## Table of Contents

- [The Core Idea](#the-core-idea)
- [Inspiration, Not Imitation](#inspiration-not-imitation)
- [Typography](#typography)
- [Color](#color)
- [Spacing & Whitespace](#spacing--whitespace)
- [Motion](#motion)
- [What's Deliberately Absent](#whats-deliberately-absent)

## The Core Idea

The site should feel like opening a printed photography book, not browsing a commercial website. A book doesn't compete with its own photographs — the page design recedes so the image is the only thing you're looking at. Concretely, that means:

- **Photography always comes first.** If a UI decision and a photograph are in tension (e.g. an overlay dimming an image so text stays legible), the UI yields as much as it can while still being usable — see the hero gradient overlay in `HeroSection.tsx`, which fades in from 50% down rather than covering the whole frame.
- **The interface should be quiet.** Navigation, buttons, and labels are small, low-contrast until interacted with, and disappear from attention once you know where they are.
- **Calm pacing.** No auto-playing carousels, no attention-grabbing motion, no urgency-driven UI patterns (countdown timers, "look now" badges). This is a portfolio, not a storefront.

## Inspiration, Not Imitation

The visual direction is informed by photographers/creators like **Teo Crawford** and **Peter McKinnon** — specifically their shared instinct for editorial minimalism: full-bleed imagery, generous negative space, typography that's present but never louder than the photograph. Nothing in this codebase is copied from either; they're referenced here as a *style compass*, not a template. If you're extending the design, the test is "does this feel like it belongs in the same photography book," not "does this look like site X."

## Typography

Two typefaces, each with one job:

| Typeface | Role | Where |
|---|---|---|
| **Cormorant Garamond** (serif, often italic, light weight) | Editorial voice — names, headlines, pull-quotes, destination titles | `<h1>`s, hero name, "Jared Mananguit" in the footer, gallery page titles |
| **Inter** (sans-serif) | Structural/functional text — navigation, labels, body copy | Nav links, uppercase tracked eyebrows (`PORTFOLIOS`, `404`), UI chrome |

Defined once in `src/index.css` as `--font-serif` / `--font-sans` and exposed to Tailwind as `font-serif` / `font-sans` utility classes — never hardcode a font name in a component.

Recurring pattern worth noting: small uppercase labels use wide letter-spacing (`tracking-[0.2em]` to `tracking-[0.3em]`) at a tiny size (`text-[10px]`). This is the site's "eyebrow" convention — used for section labels, photo counts, and the "Scroll" indicator. It reads as quiet metadata, not a competing headline.

Headlines lean large and light (`font-light`, `italic` on the serif face) rather than bold — bold serif italics at hero scale would compete with the photograph behind them.

## Color

Two themes (light default, dark available via the theme toggle), three semantic tokens, defined in `src/index.css`:

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--primary` | `#f5f5f5` (off-white) | `#111111` (near-black) | Page background |
| `--secondary` | `#111111` | `#f5f5f5` | Primary text/foreground |
| `--accent` | `#b49b73` (muted gold) | `#d6c3a5` (lighter muted gold) | Active states, hover color, small eyebrow labels |

The palette is intentionally desaturated and narrow — three tokens, no secondary/tertiary brand colors, no semantic red/green/blue for status (this site has no forms with validation states, no notifications). The accent gold appears sparingly: active nav link, hover states, tiny "PORTFOLIOS"-style labels. It's a signature, not a highlight color used everywhere.

> **Known gap:** the accent-on-light-background combination measures roughly 2.45:1 contrast, below WCAG AA's 4.5:1 for text. Dark mode is fine (~11:1). This hasn't been changed because it's a brand color decision, not a bug — flagged here so it's a deliberate choice if it stays, not an oversight. See [ROADMAP.md](ROADMAP.md).

## Spacing & Whitespace

Whitespace is treated as a design element, not empty space to be filled. Section padding is generous (`py-32` between major homepage sections is typical), and photo grids use real gaps (`gap-6` to `gap-12`) rather than edge-to-edge tiling. The instinct: when in doubt, add space rather than another UI element.

## Motion

Every animation in this codebase is one of exactly two things:

1. **Entrance** — content fades/slides in on mount or scroll-into-view (`initial` / `animate` / `whileInView` from Motion). Always subtle: opacity + a small y-offset (`y: 20`), never scale-bounce or spring overshoot.
2. **Feedback** — hover/interaction states, done in plain CSS (`transition-colors`, `hover:-translate-y-0.5`), not JS animation. See `SocialLinks.tsx` for the pattern: opacity fade + a 1–2px lift + a subtle `scale-[1.04]`, 200ms.

Rule of thumb used throughout: **if you can't explain what an animation communicates, don't add it.** A fade-in tells the user "this content just became relevant." A bounce or spin doesn't tell them anything except "look at me" — which contradicts the whole premise of the site.

## What's Deliberately Absent

These aren't oversights — they were left out on purpose because they work against a photography-first experience:

- **Glassmorphism / frosted blur panels.** Adds visual texture that competes with photographs for attention, and reads as "product UI" rather than "photo book."
- **Bright/saturated brand colors.** See the color palette above — three muted tokens, on purpose.
- **Flashy or physics-heavy animation** (spring bounces, parallax gimmicks, auto-playing transitions). Calm pacing is part of the brand.
- **Dense UI chrome** — breadcrumbs, sidebars, filter panels, badges. The current information architecture (Home → Collections → a country) is intentionally shallow; new features should extend it carefully rather than bolting on a dashboard-style UI. See [ROADMAP.md](ROADMAP.md) for how search/filtering should probably be approached if added.
