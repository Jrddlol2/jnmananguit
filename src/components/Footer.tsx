import { SocialLinks } from './common/SocialLinks';

export function Footer() {
  return (
    <footer className="py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-serif font-light italic tracking-tight mb-2">Jared Mananguit</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent opacity-80">Travel & Documentary Photography</p>
        </div>

        <SocialLinks iconSize={17} />

        <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/40">
          &copy; {new Date().getFullYear()} All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
