import { useState } from 'react';
import { motion } from 'motion/react';
import { GalleryImage } from '../lib/gallery';
import { Lightbox } from './Lightbox';
import { SafeImage } from './SafeImage';

interface GalleryMasonryProps {
  images: GalleryImage[];
  loading?: boolean;
}

export function GalleryMasonry({ images, loading }: GalleryMasonryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  if (!loading && images.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-secondary/40">
          No photographs yet — check back soon
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {images.map((img, index) => (
          <motion.button
            key={img.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: index % 3 * 0.1 }}
            className="block w-full text-left break-inside-avoid relative group cursor-pointer"
            onClick={() => openLightbox(index)}
            aria-label={`Open photo ${index + 1} of ${images.length}`}
          >
            <SafeImage
              src={img.url}
              srcSet={`${img.thumbUrl} 900w, ${img.url} 2400w`}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={img.alt}
              className="w-full h-auto object-cover"
              fallbackLabel={img.alt}
              loading="lazy"
            />
          </motion.button>
        ))}
      </div>

      <Lightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentIndex}
      />
    </>
  );
}
