import { SafeImage } from './SafeImage';
import { cardImagePath, coverImagePath } from '../lib/gallery';

interface CoverImageProps {
  location: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  /** Use the destination's card.jpg instead of cover.jpg */
  card?: boolean;
}

export function CoverImage({ location, alt, className, loading = 'lazy', card = false }: CoverImageProps) {
  return (
    <SafeImage
      src={card ? cardImagePath(location) : coverImagePath(location)}
      alt={alt}
      className={className}
      fallbackLabel={alt}
      loading={loading}
    />
  );
}
