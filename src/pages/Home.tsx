import { HeroSection } from '../components/HeroSection';
import { DestinationGrid } from '../components/DestinationGrid';
import { destinationsList } from '../data';
import { useSEO } from '../hooks/useSEO';
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION } from '../lib/seo';

export function Home() {
  useSEO({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: '/' });

  return (
    <main>
      <HeroSection />
      <DestinationGrid destinations={destinationsList} />
    </main>
  );
}
