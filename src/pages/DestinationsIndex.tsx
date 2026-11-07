import { CollectionsHero } from '../components/CollectionsHero';
import { DestinationGrid } from '../components/DestinationGrid';
import { destinationsList } from '../data';
import { useSEO } from '../hooks/useSEO';

export function DestinationsIndex() {
  useSEO({
    title: 'Collections — Jared Mananguit Photography',
    description: 'Browse the full collection of travel photography across Japan, Taiwan, Bali, Thailand, and the UAE.',
    path: '/collections',
  });

  return (
    <main className="pb-20">
      <CollectionsHero />
      <DestinationGrid destinations={destinationsList} />
    </main>
  );
}
