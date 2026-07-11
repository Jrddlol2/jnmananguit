/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { ThemeProvider } from './components/ThemeProvider';

import { Home } from './pages/Home';

// Home is the most common landing page and stays in the main bundle;
// everything else loads on demand to keep the initial page load lean.
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const Gear = lazy(() => import('./pages/Gear').then((m) => ({ default: m.Gear })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const DestinationsIndex = lazy(() =>
  import('./pages/DestinationsIndex').then((m) => ({ default: m.DestinationsIndex }))
);
const DestinationGallery = lazy(() =>
  import('./pages/DestinationGallery').then((m) => ({ default: m.DestinationGallery }))
);

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="jared-portfolio-theme">
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-grow">
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/gear" element={<Gear />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/collections" element={<DestinationsIndex />} />
                <Route path="/collections/:id" element={<DestinationGallery />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}
