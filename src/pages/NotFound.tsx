import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export function NotFound() {
  useSEO({
    title: 'Page Not Found — Jared Mananguit Photography',
    description: 'This page could not be found.',
    path: '/404',
  });

  return (
    <main className="min-h-[80vh] flex items-center justify-center pt-32 pb-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="mb-4 tracking-[0.3em] uppercase text-[10px] text-accent opacity-80">404</div>
        <h1 className="text-5xl md:text-7xl lg:text-[112px] font-serif italic font-light tracking-tight mb-6">
          Page Not Found
        </h1>
        <p className="text-sm md:text-lg opacity-70 font-light mb-16 tracking-wide leading-relaxed max-w-lg mx-auto">
          The page you're looking for doesn't exist or has moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center text-xs md:text-sm uppercase tracking-widest text-secondary/80 hover:text-accent transition-colors duration-300 group"
        >
          Back to Home
          <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
        </Link>
      </motion.div>
    </main>
  );
}
