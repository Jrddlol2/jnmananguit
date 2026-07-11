# Gear System

**Status: not yet implemented.** The `/gear` route exists (`src/pages/Gear.tsx`) and currently renders "Coming Soon." This document specifies what it should become, so building it later is a matter of implementing a spec rather than re-deriving one.

## Table of Contents

- [Current Equipment](#current-equipment)
- [Proposed Data Shape](#proposed-data-shape)
- [How Gear Should Connect to Photo Metadata](#how-gear-should-connect-to-photo-metadata)
- [Page Design Intent](#page-design-intent)

## Current Equipment

### Cameras

| Camera | Type |
|---|---|
| Canon Kiss X4 | Digital SLR |
| Pentax Spotmatic | Film SLR |
| Kodak Ektar H35N | Film (half-frame) |

### Lenses

| Lens | Mount |
|---|---|
| Canon EF-S 18-55mm f/3.5-5.6 IS | Canon EF-S |
| Canon EF-S 55-250mm f/4-5.6 IS | Canon EF-S |
| Yongnuo 35mm f/2 | Canon EF (or matching digital mount) |
| Yongnuo 50mm f/1.8 | Canon EF (or matching digital mount) |
| Super Takumar 35mm f/3.5 | M42 screw mount (Pentax Spotmatic) |
| Super Takumar 55mm f/1.8 | M42 screw mount (Pentax Spotmatic) |

Note the natural pairing: the two Super Takumar lenses are M42-mount, matching the Pentax Spotmatic; the Canon/Yongnuo lenses pair with the Kiss X4. Worth preserving that pairing when the data model gets built — see below.

## Proposed Data Shape

Following the existing convention in `src/data/` (see `socials.ts`, `hero.ts` — one small typed config file per concern):

```ts
// src/data/gear.ts (proposed)

export interface Camera {
  id: string;            // 'canon-kiss-x4'
  name: string;           // 'Canon Kiss X4'
  type: 'digital' | 'film';
  format?: 'full-frame' | 'aps-c' | 'half-frame';
}

export interface Lens {
  id: string;             // 'super-takumar-55mm-f1-8'
  name: string;            // 'Super Takumar 55mm f/1.8'
  mount: string;            // 'M42' | 'Canon EF-S' | ...
  compatibleCameraIds: string[];
}

export const cameras: Camera[] = [ /* ... */ ];
export const lenses: Lens[] = [ /* ... */ ];
```

This mirrors `SocialLink`/`socialLinks` in `src/data/socials.ts` exactly on purpose: one typed array, one place to edit, UI renders from it. Adding a camera or lens later should be "add an object to this array," the same way adding a social platform is today.

## How Gear Should Connect to Photo Metadata

This is the part that doesn't exist yet at all — see [ROADMAP.md](ROADMAP.md#metadata-architecture) for the full proposed per-photo metadata schema. The short version: each photo would eventually carry an optional `cameraId` / `lensId` / `filmStockId`, which is how a future "Gear" page could show "photos shot with the Pentax Spotmatic" as a filtered gallery rather than a static equipment list. Until that metadata layer exists, `/gear` can ship as a static equipment page (camera/lens list, no photo linkage) without blocking on it.

## Page Design Intent

Consistent with [DESIGN.md](DESIGN.md): this should read as an equipment page in a photography book's back matter, not a spec-sheet/e-commerce comparison table. Think large product name in the serif typeface, one or two lines about why that piece of gear gets used, maybe one photograph shot with it — not a dense table of specs. Camera and lens pairing (which lens goes with which body) is worth showing visually, not just as a flat list.
