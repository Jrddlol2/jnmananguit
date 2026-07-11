import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { destinations } from '../data';
import { GalleryMasonry } from '../components/GalleryMasonry';
import { CoverImage } from '../components/CoverImage';
import { useGalleryImages } from '../hooks/useGalleryImages';
import { useSEO } from '../hooks/useSEO';
import { coverImagePath } from '../lib/gallery';
import { SITE_URL } from '../lib/seo';

export function DestinationGallery() {
  const { id } = useParams<{ id: string }>();
  const destination = id ? destinations[id] : null;
  const { images, loading } = useGalleryImages(id ?? '', destination?.title ?? '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useSEO({
    title: destination ? `${destination.title} Photography — Jared Mananguit` : 'Jared Mananguit Photography',
    description: destination?.description ?? '',
    path: `/collections/${id ?? ''}`,
    image: destination ? `${SITE_URL}${coverImagePath(destination.id)}` : undefined,
  });

  if (!destination) {
    return <Navigate to="/collections" replace />;
  }

  return (
    <main className="pb-32">
      {/* Hero */}
      <div className="relative h-[70vh] w-full overflow-hidden mb-24">
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-primary/40 to-primary/90" />
          <CoverImage
            location={destination.id}
            alt={destination.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </motion.div>

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 mt-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl lg:text-[112px] font-serif italic font-light tracking-tight mb-6"
          >
            {destination.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[10px] tracking-[0.3em] uppercase text-accent opacity-80"
          >
            {loading ? 'Loading…' : `${images.length} Photograph${images.length === 1 ? '' : 's'}`}
          </motion.p>
        </div>
      </div>

      {/* Intro Text */}
      <div className="max-w-3xl mx-auto px-6 mb-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-xl md:text-2xl font-serif italic font-light leading-relaxed opacity-70 tracking-wide"
        >
          {destination.description}
        </motion.p>
      </div>

      {/* Masonry Gallery */}
      <div className="max-w-[1600px] mx-auto px-6">
        <GalleryMasonry images={images} loading={loading} />
      </div>
    </main>
  );
}
