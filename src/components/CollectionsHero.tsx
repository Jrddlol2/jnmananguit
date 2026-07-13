import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SafeImage } from './SafeImage';
import { destinationsList } from '../data';
import { coverImagePath } from '../lib/gallery';

const ROTATION_MS = 6500;
const EASE = [0.22, 1, 0.36, 1] as const;
const CROSSFADE = { duration: 1.8, ease: EASE };
// Text uses AnimatePresence mode="wait" (exit fully, then enter), so its two
// halves are timed to add up to roughly the same total as the photo's single
// overlapped crossfade — keeping the "breath" in sync with the dissolve.
const TEXT_FADE = { duration: 0.9, ease: EASE };

// Each destination's own cover.jpg — already the single curated shot picked
// to represent it elsewhere on the site (grid, gallery header) — doubles as
// a slide here so there's no second image list to keep in sync.
const slides = destinationsList.map((dest) => ({
  id: dest.id,
  title: dest.title,
  image: coverImagePath(dest.id),
}));

export function CollectionsHero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Warm the cache for every slide up front so rotating to one later
    // doesn't show a blank frame while it fetches.
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image;
    });
  }, []);

  useEffect(() => {
    // Re-armed on every index change (auto-advance or manual dot click) so a
    // manual selection gets its own full ROTATION_MS on screen instead of
    // being overridden by a tick already in flight.
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATION_MS);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={slides[index].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={CROSSFADE}
          className="absolute inset-0 z-0"
        >
          <SafeImage
            src={slides[index].image}
            alt={`${slides[index].title} — travel photography`}
            className="w-full h-full object-cover"
            fallbackLabel={slides[index].title}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        </motion.div>
      </AnimatePresence>

      {/* Whole-image vignette — a photographic framing device, not a
          contrast mechanism. Barely perceptible; darkens only the far
          corners so the photo itself stays untouched. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_100%_90%_at_50%_50%,transparent_60%,rgba(0,0,0,0.25)_100%)]" />

      {/* Seam into the grid section below — cosmetic blend into the page
          background, kept short so it never doubles as the text scrim. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/5 bg-gradient-to-b from-transparent to-primary" />

      {/* Legibility scrim — no card, no border, no blur filter. Just a very
          long, soft feather behind the type so it fades to nothing well
          before reaching the photo's edges. The support should be felt,
          never seen. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_75%_55%_at_50%_70%,rgba(0,0,0,0.3)_0%,rgba(0,0,0,0.1)_45%,transparent_75%)]" />

      <div className="relative z-20 h-full flex flex-col items-center justify-end px-6 pb-20 md:pb-24 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[index].id}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.5 }}
            transition={TEXT_FADE}
            className="max-w-xl mx-auto"
          >
            <div className="mx-auto mb-7 h-px w-10 bg-accent/70" />
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-serif italic font-light leading-[1.05] tracking-tight text-white mb-5 [text-shadow:0_4px_32px_rgba(0,0,0,0.3)]">
              All Destinations
            </h1>
            <p className="mx-auto text-sm md:text-base font-light text-white/80 leading-loose tracking-wide [text-shadow:0_2px_20px_rgba(0,0,0,0.25)]">
              Explore the full collection of travel logs. Each gallery contains a curated selection of moments
              capturing the essence of the location.
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center gap-2.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setIndex(i)}
              aria-label={`Show ${slide.title}`}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? 'w-5 bg-white' : 'w-1 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
