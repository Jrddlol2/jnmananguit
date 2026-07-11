import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

// Renders an <img>, but swaps to a graceful placeholder instead of a
// broken-image icon if the src 404s (e.g. a placeholder folder is still empty).
export function SafeImage({ src, alt, className, fallbackLabel, ...rest }: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-secondary/5 ${className ?? ''}`}>
        <div className="flex flex-col items-center gap-2 text-secondary/25 px-4 text-center">
          <ImageOff size={28} strokeWidth={1} />
          {fallbackLabel && (
            <span className="text-[9px] uppercase tracking-[0.25em]">{fallbackLabel}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
