import { SafeImage } from './SafeImage';
import { coverImagePath } from '../lib/gallery';

interface CoverImageProps {
  location: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function CoverImage({ location, alt, className, loading = 'lazy' }: CoverImageProps) {
  return (
    <SafeImage
      src={coverImagePath(location)}
      alt={alt}
      className={className}
      fallbackLabel={alt}
      loading={loading}
    />
  );
}
