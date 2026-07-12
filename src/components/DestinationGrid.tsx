import { Link } from 'react-router-dom';
import { Destination } from '../data';
import { CoverImage } from './CoverImage';
import { useGalleryImages } from '../hooks/useGalleryImages';

interface DestinationGridProps {
  destinations: Destination[];
}

export function DestinationGrid({ destinations }: DestinationGridProps) {
  return (
    <div className="py-32 px-6 max-w-7xl mx-auto">
      <div className="mb-20 text-center">
        <h2 className="mb-4 tracking-[0.3em] uppercase text-[10px] text-accent opacity-80">Portfolios</h2>
        <h3 className="text-4xl md:text-6xl font-serif italic font-light tracking-tight">Featured Destinations</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        {destinations.map((dest) => (
          <DestinationCard key={dest.id} destination={dest} />
        ))}
      </div>
    </div>
  );
}

interface DestinationCardProps {
  destination: Destination;
}

function DestinationCard({ destination }: DestinationCardProps) {
  const { images } = useGalleryImages(destination.id, destination.title);

  return (
    <Link
      to={`/collections/${destination.id}`}
      className="group block"
    >
      <div className="relative overflow-hidden aspect-[4/5] mb-8">
        <CoverImage
          location={destination.id}
          alt={destination.title}
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="flex justify-between items-baseline">
        <h4 className="text-4xl font-serif italic font-light group-hover:text-accent transition-colors duration-300">
          {destination.title}
        </h4>
        <span className="text-[10px] uppercase tracking-[0.3em] text-secondary/50">
          {images.length} Photos
        </span>
      </div>
      <p className="mt-4 text-sm opacity-70 font-light leading-relaxed max-w-md">
        {destination.description}
      </p>
      <div className="mt-8 inline-flex items-center text-xs uppercase tracking-widest text-secondary hover:text-accent transition-colors duration-300">
        View Collection
        <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
          →
        </span>
      </div>
    </Link>
  );
}
