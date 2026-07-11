# Contributing

This is a personal project with a single owner, but the guidance below exists so it stays consistent whether the next person touching it is a collaborator or the owner returning six months later with no memory of these decisions. Follow it the way you'd follow guidance from a project you respect, even if no one's enforcing it.

## Table of Contents

- [Before You Start](#before-you-start)
- [Workflow](#workflow)
- [Coding Style](#coding-style)
- [Adding a Component](#adding-a-component)
- [Asset Management](#asset-management)
- [Checklist Before Calling Something Done](#checklist-before-calling-something-done)

## Before You Start

Read, in this order:

1. [DESIGN.md](DESIGN.md) — the visual/interaction rules. If a change conflicts with these, that's worth noticing before writing code, not after.
2. [ARCHITECTURE.md](ARCHITECTURE.md) — what runs where.
3. [STYLE_GUIDE.md](STYLE_GUIDE.md) — implementation conventions.

## Workflow

- `npm install`, `npm run dev` to work locally.
- `npm run lint` (typecheck) and `npm run build` must both pass before considering a change finished — see the [production checklist in the README](../README.md#production-checklist).
- No test suite exists in this project. Verify changes by actually running the dev server and looking at the result — screenshot or describe what you checked when handing off work.

## Coding Style

- Match [STYLE_GUIDE.md](STYLE_GUIDE.md) exactly — component structure, data file shape, Tailwind conventions, naming.
- **Don't introduce a new pattern for something an existing pattern already covers.** If you need "a list of things rendered somewhere," look at `src/data/socials.ts` before inventing a new approach. If you need an image that might not exist yet, use `SafeImage` before writing new fallback logic.
- **No new dependencies without a real reason.** This project has consciously stayed small — React, React Router, Tailwind, Motion, Lucide, and `sharp` (build-time only). Before adding a package, check whether the problem is solvable with what's already here. If not, the addition should earn its place: does it replace meaningfully more custom code than its own size/complexity costs? (`useSEO` in this project is a ~50-line hook instead of pulling in `react-helmet` — that trade was made deliberately.)
- **Comments explain *why*, not *what*.** Code should be readable enough that a comment restating it is noise. Reach for a comment when there's a non-obvious constraint, a workaround, or a decision that would look wrong without context — see `src/lib/gallery.ts`'s comments on the manifest/probe fallback for the tone to match.

## Adding a Component

1. Does this belong in `src/pages/` (a route renders it directly) or `src/components/` (composed into something else)? See [STYLE_GUIDE.md](STYLE_GUIDE.md#component-conventions).
2. Does it render a photo? Go through `SafeImage` (directly, or via `CoverImage` if it's specifically a destination cover).
3. Does it need entrance animation? Match the existing Motion pattern — check a sibling component for the exact `initial`/`animate`/`duration` values in use rather than inventing new ones.
4. Does it introduce a new "list of things" (nav items, social platforms, equipment, etc.)? Use the `src/data/` pattern, not an inline array in the component.
5. Run `npm run lint` before considering it done.

## Asset Management

- **Photos never go directly into `public/images/<country>/` by hand.** They come from `raw-photos/<id>/` through `npm run import-images`. See [IMAGE_PIPELINE.md](IMAGE_PIPELINE.md). (This has been gotten wrong before — a batch of camera-original files once ended up placed directly in `public/images/bali/`, overwriting the processed gallery with unprocessed originals. If you ever see huge, oddly-named files in a `public/images/<country>/` folder alongside the numbered ones, that's what happened — move them into `raw-photos/<id>/` and re-run the pipeline.)
- **The hero image and any other single fixed-name image** (not part of a numbered gallery) can be replaced by dropping a new file at the same path, but should be reasonably sized first — the pipeline's habit of capping dimensions and re-encoding with `mozjpeg` is worth doing manually for one-off images too, not just relying on "it's just one file, size doesn't matter." (`public/images/hero/homepage-hero.jpg` was originally an unprocessed 5184×3456 camera original; it was resized down before being kept in the repo.)
- **Never commit an unprocessed camera-original dump.** `raw-photos/` is gitignored for exactly this reason — it can be large and is fully reproducible from the pipeline; only `public/images/` (the processed output) belongs in git.

## Checklist Before Calling Something Done

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Changes were actually viewed in a running dev server, not just read as code
- [ ] If touching styling/layout: checked at least one mobile width and one desktop width
- [ ] If touching image handling: confirmed the empty-state/missing-image behavior still degrades gracefully (see `SafeImage`) rather than showing a broken icon
- [ ] Relevant doc in `docs/` updated if the change makes something in it inaccurate — a doc that silently drifts from reality is worse than no doc
