import { useEffect, useState } from 'react';
import { loadGalleryImages, GalleryImage } from '../lib/gallery';

export function useGalleryImages(location: string, title: string) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    loadGalleryImages(location, title).then((result) => {
      if (!cancelled) {
        setImages(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location, title]);

  return { images, loading };
}
