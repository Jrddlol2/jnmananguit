import { motion, useScroll, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeProvider';
import { SocialLinks } from './common/SocialLinks';
import { Moon, Sun, Menu, X } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Collections', path: '/collections' },
    { name: 'Gear', path: '/gear' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled || isMenuOpen ? 'border-secondary/10 bg-primary/95 backdrop-blur-md' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <Link to="/" className="text-xs tracking-[0.4em] uppercase font-semibold">
          Jared Mananguit
        </Link>

        <div className="hidden md:flex space-x-12 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-xs uppercase tracking-[0.2em] transition-colors hover:text-accent ${
                location.pathname === link.path ||
                (location.pathname.startsWith('/collections') && link.path === '/collections')
                  ? 'text-accent'
                  : 'text-secondary'
              }`}
            >
              {link.name}
            </Link>
          ))}

          <div className="h-3 w-px bg-secondary/20" />

          <SocialLinks iconSize={15} />

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-secondary/70 hover:text-accent transition-colors ml-1"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="md:hidden flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-secondary/70 hover:text-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="text-secondary/70 hover:text-accent transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="md:hidden overflow-hidden border-t border-secondary/10 bg-primary/95 backdrop-blur-md"
          >
            <div className="px-6 py-8 flex flex-col items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm uppercase tracking-[0.2em] transition-colors hover:text-accent ${
                    location.pathname === link.path ||
                    (location.pathname.startsWith('/collections') && link.path === '/collections')
                      ? 'text-accent'
                      : 'text-secondary'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px w-12 bg-secondary/20 mt-2" />

              <SocialLinks iconSize={18} className="justify-center" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
