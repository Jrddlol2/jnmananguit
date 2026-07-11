import { motion } from 'motion/react';
import { SocialLinks } from '../components/common/SocialLinks';
import { useSEO } from '../hooks/useSEO';

export function Contact() {
  useSEO({
    title: 'Contact — Jared Mananguit Photography',
    description: 'Get in touch with Jared Mananguit for commercial, editorial, or print photography inquiries.',
    path: '/contact',
  });

  return (
    <main className="min-h-[80vh] flex items-center justify-center pt-32 pb-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl w-full text-center"
      >
        <h1 className="text-5xl md:text-7xl lg:text-[112px] font-serif italic font-light tracking-tight mb-16">Get in Touch</h1>

        <div className="flex flex-col gap-8 text-[10px] md:text-sm tracking-[0.3em] uppercase items-center">
          <a
            href="mailto:mananguitjaredashern@gmail.com"
            className="hover:text-accent transition-colors duration-300 border-b border-transparent hover:border-accent pb-1"
          >
            mananguitjaredashern@gmail.com
          </a>
          
          <SocialLinks iconSize={18} className="mt-8 justify-center" />
        </div>
      </motion.div>
    </main>
  );
}
