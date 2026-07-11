export interface Destination {
  id: string;
  title: string;
  description: string;
}

// Photos themselves are not listed here — they're loaded automatically from
// /public/images/<id>/ (see src/lib/gallery.ts). To add a new destination,
// add its metadata below and drop a cover.jpg + numbered photos into a
// matching /public/images/<id>/ folder.
export const destinations: Record<string, Destination> = {
  japan: {
    id: 'japan',
    title: 'Japan',
    description: 'A visual study of contrasts, capturing the relentless rhythm of Tokyo\'s streets alongside the atmospheric landscapes surrounding Mount Fuji. This collection documents early mornings, local trains, and the cinematic interplay of light and weather in everyday spaces.',
  },
  taiwan: {
    id: 'taiwan',
    title: 'Taiwan',
    description: 'Observing the balance between Taiwan\'s dense urban environments and its serene natural topography. From the structured architecture of Taipei and Taichung to the stillness of Sun Moon Lake, these images explore everyday transportation and life between the mountains and the city.',
  },
  bali: {
    id: 'bali',
    title: 'Bali',
    description: 'A quiet observation of rural landscapes and atmospheric details. This collection focuses on the subtle interplay of light and shadow, capturing the still moments between the island\'s ancient rituals and everyday life.',
  },
  thailand: {
    id: 'thailand',
    title: 'Thailand',
    description: 'An ongoing documentation of Bangkok\'s constant motion. This work focuses on the density of urban life—the layered streets, night markets, and the quiet moments found within the city\'s overwhelming energy and relentless heat.',
  },
};

export const destinationsList = Object.values(destinations);
