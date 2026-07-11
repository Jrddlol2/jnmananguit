# Style Guide

Concrete conventions for writing code that looks like it belongs in this codebase. For *why* the visual design looks the way it does, see [DESIGN.md](DESIGN.md); this document is about implementation patterns.

## Table of Contents

- [Component Conventions](#component-conventions)
- [The SafeImage Pattern](#the-safeimage-pattern)
- [Data Files](#data-files)
- [Tailwind Usage](#tailwind-usage)
- [Motion Usage](#motion-usage)
- [Naming Conventions](#naming-conventions)
- [TypeScript](#typescript)

## Component Conventions

- **One component per file, named export, filename matches the component.** `export function SocialLinks(...)` in `SocialLinks.tsx`. No default exports except `App.tsx` (required by the Vite entry point).
- **Pages live in `src/pages/`, reusable pieces in `src/components/`.** A page is something a route renders directly; a component is composed into one or more pages. `src/components/common/` is for components used across otherwise-unrelated parts of the site (currently just `SocialLinks`) — if something's only ever used from one page, it doesn't need to live there.
- **Props interfaces are named `<Component>Props`**, declared just above the component, not in a separate types file — keep a component and its prop shape next to each other.
- **Optional props get sane defaults via destructuring**, not `??` inside the body:
  ```tsx
  export function CoverImage({ location, alt, className, loading = 'lazy' }: CoverImageProps) { ... }
  ```

## The SafeImage Pattern

`SafeImage` is the single most-reused component in the codebase (`HeroSection`, `CoverImage`, `GalleryMasonry` all funnel through it) and it exists to solve one specific problem: a raw `<img>` shows a broken-image icon when its `src` 404s, which happens constantly here because photo folders are allowed to be legitimately empty (a country with no photos yet, a hero image not yet uploaded). `SafeImage` catches the `onError` and renders a small placeholder (icon + label) instead.

**Rule: any `<img>` whose source comes from `public/images/` should go through `SafeImage`, not a raw `<img>` tag.** If you're rendering a photo and reaching for `<img src=...>` directly, that's very likely a sign the image should be going through `SafeImage` (or a component that already wraps it, like `CoverImage`) instead.

`SafeImage` extends `ImgHTMLAttributes<HTMLImageElement>`, so anything a normal `<img>` accepts (`loading`, `srcSet`, `sizes`, `style`, ...) passes straight through — it's a drop-in replacement, not a restricted API.

## Data Files

`src/data/` holds small, typed, single-purpose config files — the pattern to follow when adding a new "list of things the UI renders from":

```ts
// the shape
export interface Thing {
  /* ... */
}

// the one array everything renders from
export const things: Thing[] = [ /* ... */ ];
```

`socials.ts` is the reference implementation: one array, one interface, and every place a social icon appears (`Navbar`, `Footer`, `Contact`, the mobile drawer) renders from that same array via `<SocialLinks />`. Adding a platform means adding one object — never touching a component. When you're tempted to hardcode a list inline in a component (nav links, equipment, anything with more than 2-3 items that might grow), this is the pattern to reach for instead. See [GEAR_SYSTEM.md](GEAR_SYSTEM.md) and [FILM_SYSTEM.md](FILM_SYSTEM.md) for two data files designed but not yet built, following this exact shape.

`src/lib/` is for functions, not data — path builders (`gallery.ts`), constants used by logic rather than rendered as a list (`seo.ts`).

## Tailwind Usage

- **Utility classes inline, no `@apply`, no separate stylesheets per component.** The two exceptions in `src/index.css` (`.h-hero`, `.hero-image`) exist only because they need either a cascade fallback trick (`vh` → `svh` → `dvh`) or a media query keyed to CSS custom properties — neither expressible as a Tailwind utility class. Don't reach for a custom CSS class before checking whether Tailwind's arbitrary-value syntax (`text-[10px]`, `tracking-[0.3em]`) covers it.
- **The "eyebrow" label convention**: small uppercase section labels use `text-[10px] uppercase tracking-[0.3em] text-accent opacity-80` (or very close to it) — see "PORTFOLIOS" in `DestinationGrid`, "404" in `NotFound`, "About the Photographer" in the (now-removed) About page. If you're adding a new section label, match this pattern rather than inventing a new label style.
- **Hover/interaction states are plain Tailwind** (`hover:`, `transition-colors`, `group-hover:`), not Motion's `whileHover`. See [Motion Usage](#motion-usage) below for the line between the two.
- **Theme colors only via the semantic tokens** (`text-secondary`, `bg-primary`, `text-accent`, from `src/index.css`'s `@theme` block) — never a hardcoded hex value in a component. This is what makes the dark/light theme toggle work everywhere for free.

## Motion Usage

Two, and only two, patterns — see [DESIGN.md](DESIGN.md#motion) for the reasoning:

1. **Entrance animation** — `motion.div` (or `motion.button`, etc.) with `initial` / `animate` (mount) or `initial` / `whileInView` + `viewport={{ once: true }}` (scroll-triggered). Keep it to opacity + a small translate; look at any existing page component for the exact values in use (`y: 20`, `duration: 0.6-0.8`) before inventing new ones.
2. **Interaction feedback** — plain CSS via Tailwind (`hover:`, `transition-*`), not `whileHover`/`whileTap`. This codebase has zero `whileHover` usage — keep it that way unless there's a specific reason plain CSS can't express what's needed.

## Naming Conventions

- Components: `PascalCase.tsx`, matching the exported component name.
- Hooks: `useCamelCase.ts`, one hook per file, in `src/hooks/`.
- Data/lib files: `camelCase.ts`.
- Destination/social/gear/film `id` fields: lowercase, no spaces (`japan`, `youtube`, `canon-kiss-x4`) — these often end up in URLs or filenames, so keep them URL-safe.
- CSS custom properties: `--kebab-case`.

## TypeScript

- No `any`. If a type is genuinely dynamic (e.g. JSON fetched at runtime), narrow it explicitly rather than casting past the type checker — see `readManifestCount` in `src/lib/gallery.ts` for the pattern (fetch, parse, check the shape with a real conditional, return `null` on anything unexpected).
- Exported interfaces for anything crossing a component boundary (props, data shapes); inferred types are fine for local variables.
- `npm run lint` (`tsc --noEmit`) must pass with zero errors before considering a change done — there's no separate ESLint config in this project, so the type checker is the whole static-analysis safety net.
