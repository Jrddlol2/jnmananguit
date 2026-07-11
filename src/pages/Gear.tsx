import { useSEO } from '../hooks/useSEO';

export function Gear() {
  useSEO({
    title: 'Gear — Jared Mananguit Photography',
    description: 'The cameras and lenses Jared Mananguit shoots with.',
    path: '/gear',
  });

  return (
    <main className="pt-32 pb-32 px-6 text-center text-sm uppercase tracking-widest text-secondary/50">
      Coming Soon
    </main>
  );
}
