import { Instagram, Youtube, type LucideIcon } from 'lucide-react';

export interface SocialLink {
  name: string;
  href: string;
  icon: LucideIcon;
  ariaLabel: string;
}

// Add a new platform here (e.g. GitHub, Flickr, 500px, Threads, X) and it
// appears everywhere SocialLinks is used — no other code changes needed.
export const socialLinks: SocialLink[] = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/archive.ni.jared/',
    icon: Instagram,
    ariaLabel: 'Instagram',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@jerddlol',
    icon: Youtube,
    ariaLabel: 'YouTube',
  },
];
