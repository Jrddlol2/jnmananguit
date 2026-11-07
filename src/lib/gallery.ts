export interface GalleryImage {
  id: string;
  url: string;
  /** Smaller variant for masonry thumbnails (see srcset usage in GalleryMasonry) */
  thumbUrl: string;
  alt: string;
}

const IMAGE_ROOT = '/images';
const GALLERY_EXTENSION = 'jpg';

// Upper bound used only by the fallback probe below (no manifest present).
const MAX_GALLERY_PHOTOS = 60;

export function destinationImagePath(location: string, filename: string): string {
  return `${IMAGE_ROOT}/${location}/${filename}`;
}

export function coverImagePath(location: string): string {
  return destinationImagePath(location, `cover.${GALLERY_EXTENSION}`);
}

export function cardImagePath(location: string): string {
  return destinationImagePath(location, `card.${GALLERY_EXTENSION}`);
}

function buildGalleryImage(location: string, title: string, n: number): GalleryImage {
  const padded = String(n).padStart(3, '0');
  const filename = `${padded}.${GALLERY_EXTENSION}`;
  return {
    id: `${location}-${filename}`,
    url: destinationImagePath(location, filename),
    thumbUrl: destinationImagePath(location, `${padded}-thumb.${GALLERY_EXTENSION}`),
    alt: `${title} — Photo ${n}`,
  };
}

async function readManifestCount(location: string): Promise<number | null> {
  try {
    const res = await fetch(destinationImagePath(location, 'manifest.json'));
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch {
    return null;
  }
}

async function headExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fallback for galleries with no manifest.json (e.g. numbered photos dropped
 * in by hand rather than through the import pipeline). Uses HEAD requests —
 * headers only, no image bytes — to find how many exist.
 */
async function probeGalleryCount(location: string): Promise<number> {
  const candidates = Array.from({ length: MAX_GALLERY_PHOTOS }, (_, i) => i + 1);
  const found = await Promise.all(
    candidates.map(async (n) => {
      const filename = `${String(n).padStart(3, '0')}.${GALLERY_EXTENSION}`;
      const exists = await headExists(destinationImagePath(location, filename));
      return exists ? n : 0;
    })
  );
  return found.filter((n) => n > 0).length;
}

/**
 * Discovers a location's numbered gallery photos. The import pipeline
 * (scripts/import-images) writes a manifest.json with the photo count
 * alongside cover.jpg/001.jpg/..., so this is normally a single small
 * fetch — no per-image probing, and no images are downloaded until the
 * browser actually needs them (respecting each <img loading="lazy">).
 */
export async function loadGalleryImages(location: string, title: string): Promise<GalleryImage[]> {
  const manifestCount = await readManifestCount(location);
  const count = manifestCount ?? (await probeGalleryCount(location));

  return Array.from({ length: count }, (_, i) => buildGalleryImage(location, title, i + 1));
}
