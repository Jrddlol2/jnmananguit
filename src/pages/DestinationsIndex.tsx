import { motion } from 'motion/react';
import { DestinationGrid } from '../components/DestinationGrid';
import { destinationsList } from '../data';
import { useSEO } from '../hooks/useSEO';

export function DestinationsIndex() {
  useSEO({
    title: 'Collections — Jared Mananguit Photography',
    description: 'Browse the full collection of travel photography across Japan, Taiwan, Bali, and Thailand.',
    path: '/collections',
  });

  return (
    <main className="pt-32 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-6 text-center mb-12"
      >
        <h1 className="text-5xl md:text-7xl lg:text-[112px] font-serif italic font-light tracking-tight mb-6">All Destinations</h1>
        <p className="max-w-2xl mx-auto text-base md:text-lg font-light opacity-70 font-serif italic leading-relaxed tracking-wide">
          Explore the full collection of travel logs. Each gallery contains a curated selection of moments capturing the essence of the location.
        </p>
      </motion.div>
      
      <DestinationGrid destinations={destinationsList} />
    </main>
  );
}
