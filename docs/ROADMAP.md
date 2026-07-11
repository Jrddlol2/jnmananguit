# Roadmap

Future direction, grouped by what depends on what. Nothing here is committed or scheduled — this is a map of "if this gets built, here's how it should fit," so a future session doesn't have to re-derive the plan from scratch.

## Table of Contents

- [Metadata Architecture](#metadata-architecture)
- [Feature Roadmap](#feature-roadmap)
- [Dependency Order](#dependency-order)
- [Open Design Question: Accent Contrast](#open-design-question-accent-contrast)

## Metadata Architecture

The single foundational piece almost everything else below builds on. Right now, a photo's only "metadata" is its filename mapping in `raw-photos/<id>/metadata.json` (original → new filename, cover-selection score) — that's a build-time trace file, not something the site reads at runtime. Nothing about camera, lens, film, date, or location is captured anywhere yet.

Proposed per-photo shape:

```ts
export interface PhotoMetadata {
  id: string;                // matches the gallery filename, e.g. 'japan-001'
  country: string;            // destination id — already implicit today, made explicit here
  cameraId?: string;          // see GEAR_SYSTEM.md
  lensId?: string;            // see GEAR_SYSTEM.md
  filmStockId?: string;       // see FILM_SYSTEM.md — omitted for digital photos
  date?: string;               // ISO date
  location?: string;           // free-text, e.g. 'Kawaguchiko, Yamanashi'
  gps?: { lat: number; lng: number }; // optional — see privacy note below
  description?: string;
  tags?: string[];
}
```

**Why this matters beyond just "more data":** every other unbuilt feature that references a specific photo — search, filtering, map view, EXIF viewer, "related photos," camera/lens/film archive pages — needs *some* structured way to know things about a photo beyond its filename. This is the one piece of infrastructure that unblocks the rest, which is why it's listed first rather than alphabetically.

**Where it should live:** most likely as a generated file per country (`public/images/<id>/photos.json`, in the same spirit as the existing `manifest.json`), populated either by extending `scripts/import-images/run.mjs` to read EXIF data via `sharp().metadata()` (camera model, date, GPS are often already in the file — no manual entry needed for those fields) or by hand-editing for details EXIF can't know (film stock, since film cameras don't write EXIF).

**Privacy note on GPS:** EXIF GPS coordinates from a phone are precise enough to identify a home address if a photo was taken there. If/when this field gets populated automatically from EXIF, it needs a deliberate decision about precision (exact coordinates vs. rounded/city-level) and probably a way to exclude specific photos — not just piped through blindly.

## Feature Roadmap

Grouped by theme, not priority — priority is a decision for whoever's building next, not something to lock in here.

### Discovery & Navigation
- **Search** — across titles, descriptions, tags, locations. Needs the metadata layer above.
- **Filtering** — by country, camera, lens, film stock, year. Same dependency.
- **Map view** — pin photos by GPS. Needs metadata + a mapping library decision (worth being deliberate about bundle size here — see [DESIGN.md](DESIGN.md#whats-deliberately-absent) on avoiding unnecessary dependencies).
- **Collections by year** — a chronological view alongside the existing by-country one. Needs `date` in metadata.

### Photo Detail & Context
- **EXIF viewer** — camera, lens, aperture, shutter speed, ISO shown alongside a photo (likely in the Lightbox). Needs metadata.
- **Related photos** — "more from this trip" or "shot on the same film stock," surfaced in the Lightbox. Needs metadata.
- **Favorites** — visitor-side, almost certainly `localStorage`-based (no backend to persist to) — same pattern as `ThemeProvider`'s theme persistence.

### New Top-Level Sections
- **Camera pages** — see [GEAR_SYSTEM.md](GEAR_SYSTEM.md).
- **Lens pages** — see [GEAR_SYSTEM.md](GEAR_SYSTEM.md).
- **Film pages** — see [FILM_SYSTEM.md](FILM_SYSTEM.md).
- **Equipment statistics** — "most-used lens," "photos per camera" — a derived view over the gear + metadata data, not new data itself.
- **Photo stories / photo essays / travel journal** — longer-form narrative pages mixing prose and photos, closer to a blog post than a gallery grid. Would need its own content model (likely markdown/MDX-based rather than the structured `Destination` pattern).
- **Blog** — general-purpose long-form writing, separate from photo essays.
- **Projects** — curated cross-country groupings that don't map to a single destination (e.g. "portraits," "night photography").
- **Print shop** — the one item on this list with real scope: payment processing, order fulfillment, likely a third-party commerce integration. Worth treating as a separate initiative, not an incremental feature.

## Dependency Order

If tackling more than one of these, this is roughly the order that avoids rework:

1. **Metadata architecture** (above) — almost everything else reads from this.
2. **Gear + film data files** (`src/data/gear.ts`, `src/data/film.ts`) — static content, no dependency on metadata, safe to build anytime, but most valuable once photos can link to them.
3. **EXIF viewer, related photos, filtering** — consume metadata once it exists.
4. **Search, map view, equipment statistics, collections by year** — consume metadata + benefit from filtering existing first.
5. **Photo stories / blog / projects / print shop** — largely independent of the above; sequence by actual interest, not technical dependency.

## Open Design Question: Accent Contrast

Not a feature — a flagged decision. The accent gold color (`#b49b73`) on light backgrounds measures ~2.45:1 contrast, below WCAG AA's 4.5:1 for text (see [DESIGN.md](DESIGN.md#color)). Whether to adjust the color, restrict it to strictly decorative (non-text) uses, or accept it as a deliberate brand trade-off is a design call, not something resolved by this document — recorded here so it doesn't get silently forgotten.
