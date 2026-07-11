import { motion } from 'motion/react';
import { socialLinks } from '../../data/socials';

interface SocialLinksProps {
  iconSize?: number;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}

export function SocialLinks({
  iconSize = 16,
  orientation = 'horizontal',
  showLabels = false,
  className = '',
}: SocialLinksProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`flex ${orientation === 'vertical' ? 'flex-col items-start gap-4' : 'flex-row items-center gap-6'} ${className}`}
    >
      {socialLinks.map(({ name, href, icon: Icon, ariaLabel }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          title={ariaLabel}
          className="inline-flex items-center gap-2 text-secondary opacity-60 hover:opacity-100 hover:text-accent transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.04]"
        >
          <Icon size={iconSize} strokeWidth={1.5} />
          {showLabels && (
            <span className="text-[10px] uppercase tracking-[0.25em]">{name}</span>
          )}
        </a>
      ))}
    </motion.div>
  );
}
