# Film System

**Status: not yet implemented.** There is no `/film` route and no film data file yet. This document specifies the intended design so it can be built later without re-deriving the concept.

## Table of Contents

- [Why Film Is First-Class Content](#why-film-is-first-class-content)
- [Current Film Stocks](#current-film-stocks)
- [Proposed Data Shape](#proposed-data-shape)
- [Page Design Intent](#page-design-intent)

## Why Film Is First-Class Content

A meaningful share of this portfolio's photos are shot on film, not just digital. Film stock isn't incidental metadata the way, say, ISO might be — different stocks have distinct color science, grain, and contrast character that's part of *why a photo looks the way it does*. Treating film stocks as their own content type (with a name, a character description, maybe example photos) rather than burying them in EXIF-style metadata reflects that they're a creative choice, not a technical afterthought.

## Current Film Stocks

| Film Stock | Character |
|---|---|
| Fuji C200 | Everyday color negative — cooler, slightly desaturated greens |
| Fuji 400 | Faster everyday stock, more latitude in mixed light |
| Kodak Gold 200 | Warm, classic "family photo album" color response |
| Kodak ColorPlus 200 | Budget-friendly, warm, punchy in good light |
| Kodak Ultramax 400 | Versatile, saturated, forgiving in low light |
| Cinestill 800T | Tungsten-balanced, halation glow around bright lights — distinct night/neon look |

(Character notes above are general/well-known traits of these stocks, included as a starting point — worth replacing with the photographer's own impressions from actually shooting them.)

## Proposed Data Shape

Same convention as [GEAR_SYSTEM.md](GEAR_SYSTEM.md) and the existing `src/data/` files:

```ts
// src/data/film.ts (proposed)

export interface FilmStock {
  id: string;              // 'cinestill-800t'
  name: string;             // 'Cinestill 800T'
  manufacturer: string;      // 'Cinestill'
  iso: number;               // 800
  colorBalance: 'daylight' | 'tungsten' | 'black-and-white';
  description: string;       // character notes, in the photographer's own words
}

export const filmStocks: FilmStock[] = [ /* ... */ ];
```

Mirrors the proposed `gear.ts` shape from GEAR_SYSTEM.md — same reasoning: one typed array, one file, everything else renders from it.

## Page Design Intent

Same visual language as the rest of the site: treat each film stock the way a photo book treats a technique, not the way a camera store treats a product. A stock's entry should probably be presented alongside 2-3 example photos that were actually shot on it, since the character of a film stock is much easier to *see* than to describe in a spec table. Once the per-photo metadata layer from [ROADMAP.md](ROADMAP.md#metadata-architecture) exists, a film stock page becomes a filtered gallery ("everything shot on Cinestill 800T") rather than a static description — the same pattern as the gear page.
