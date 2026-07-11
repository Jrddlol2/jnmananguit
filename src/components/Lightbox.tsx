import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { GalleryImage } from '../lib/gallery';

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNavigate((currentIndex + 1) % images.length);
    if (e.key === 'ArrowLeft') onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [handleKeyDown, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${currentIndex + 1} of ${images.length}`}
          className="fixed inset-0 z-[100] bg-primary flex items-center justify-center"
        >
          {/* Controls */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-6 right-6 z-[101] text-secondary/70 hover:text-secondary transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>

          <button
            onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            className="absolute left-6 z-[101] text-secondary/50 hover:text-secondary transition-colors"
          >
            <ChevronLeft size={48} strokeWidth={1} />
          </button>

          <button
            onClick={() => onNavigate((currentIndex + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-6 z-[101] text-secondary/50 hover:text-secondary transition-colors"
          >
            <ChevronRight size={48} strokeWidth={1} />
          </button>

          {/* Image Container */}
          <div className="relative w-full h-full p-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                src={images[currentIndex].url}
                alt={images[currentIndex].alt}
                className="max-w-full max-h-full object-contain"
              />
            </AnimatePresence>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tracking-widest text-secondary/50 uppercase">
            {currentIndex + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
