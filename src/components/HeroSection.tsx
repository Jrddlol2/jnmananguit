import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { SafeImage } from './SafeImage';
import { heroImage } from '../data/hero';

const heroFocalPoints = {
  '--desktop-pos': heroImage.desktopPosition,
  '--mobile-pos': heroImage.mobilePosition,
} as CSSProperties;

export function HeroSection() {
  return (
    <div className="relative h-hero w-full overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 z-0 bg-primary"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-50% to-primary/80" />
        <SafeImage
          src={heroImage.image}
          alt="Jared Mananguit Photography"
          className="hero-image w-full h-full object-cover"
          style={heroFocalPoints}
          fallbackLabel="Hero Photograph"
          loading="eager"
          fetchPriority="high"
        />
      </motion.div>

      {/* Content - Lower Left */}
      <div className="relative z-20 h-full flex flex-col justify-end px-8 md:px-16 pb-24 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl leading-none font-light tracking-tight mb-4"
        >
          Jared Mananguit
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
        >
          <h2 className="text-sm md:text-base font-light tracking-widest text-secondary/90 mb-2">
            Travel & Street Photography
          </h2>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-secondary/50 mb-8">
            Japan • Taiwan • Bali • Thailand
          </p>

          <Link
            to="/collections"
            className="inline-flex items-center text-xs md:text-sm uppercase tracking-widest text-secondary/80 hover:text-white transition-colors duration-300 group"
          >
            View Collection
            <motion.span
              className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
              initial={{ x: 0 }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator - Bottom Center */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-[9px] uppercase tracking-[0.3em] text-secondary/40">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-[1px] h-8 bg-gradient-to-b from-secondary/40 to-transparent"
        />
      </motion.div>
    </div>
  );
}
