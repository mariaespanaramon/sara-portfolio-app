// ============================================================================
// HEXAGONAL ARCHITECTURE - APPLICATION ENTRY POINT
// ============================================================================
// This file wires together all the layers of the hexagonal architecture:
// - Domain: Core business entities (src/application/domain)
// - Application: Use cases / services (src/application/service)
// - Infrastructure: Adapters and ports (src/infrastructure)
// - Presentation: React components (src/presentation/components)

import { useCallback, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './presentation/components/Header';
import { IntroSplash } from './presentation/components/IntroSplash';
import { FullscreenMenu } from './presentation/components/FullscreenMenu';
import { Hero } from './presentation/components/Hero';
import { SectionGrid } from './presentation/components/SectionGrid';
import { AboutSection } from './presentation/components/AboutSection';
import { ContactSection } from './presentation/components/ContactSection';
import { Footer } from './presentation/components/Footer';
import { WorkItemDetail } from './presentation/components/WorkItemDetail';
import { SectionPage } from './presentation/components/SectionPage';
import { MockWorkItemRepository } from './infrastructure/adapters/MockWorkItemRepository';
import { NetlifyBlobsWorkItemRepository } from './infrastructure/adapters/NetlifyBlobsWorkItemRepository';
import { MockSectionRepository } from './infrastructure/adapters/MockSectionRepository';
import { MockAboutContentRepository } from './infrastructure/adapters/MockAboutContentRepository';
import { MockContactDetailsRepository } from './infrastructure/adapters/MockContactDetailsRepository';
import { createNetlifyBlobsConfig, isNetlifyBlobsConfigured } from './infrastructure/config/netlify.config';

// Initialize repositories (dependency injection)
// In a larger application, you might use a DI container or React Context

// Work Item Repository: Use Netlify Blobs if configured, otherwise use Mock
// This follows the Dependency Inversion Principle - the app depends on the
// WorkItemRepository interface, not the concrete implementation
const workItemRepository = isNetlifyBlobsConfigured()
  ? new NetlifyBlobsWorkItemRepository(createNetlifyBlobsConfig())
  : new MockWorkItemRepository();

// Sections are mock-only for now. They will move to the same backing store as
// work items once Sara's own cover material is in place.
const sectionRepository = new MockSectionRepository();

const aboutContentRepository = new MockAboutContentRepository();
const contactDetailsRepository = new MockContactDetailsRepository();

/**
 * Home page component
 */
function HomePage() {
  return (
    <>
      <Hero />
      <SectionGrid repository={sectionRepository} />
      <AboutSection repository={aboutContentRepository} />
      <ContactSection repository={contactDetailsRepository} />
    </>
  );
}

/**
 * Main App component
 * Orchestrates all presentation components and routing
 */
function App() {
  // Held here, not in Header: the overlay has to be a sibling of the header
  // rather than a child of it, so both need access to the same state.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Stable identities: FullscreenMenu closes itself on route changes, and a
  // handler recreated on every render would make that effect fire constantly.
  const toggleMenu = useCallback(() => setIsMenuOpen((open) => !open), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <Router>
      <div className="min-h-screen bg-site-bg">
        <IntroSplash />
        <Header isMenuOpen={isMenuOpen} onToggleMenu={toggleMenu} />
        <FullscreenMenu isOpen={isMenuOpen} onClose={closeMenu} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/section/:id"
              element={
                <SectionPage
                  sectionRepository={sectionRepository}
                  workItemRepository={workItemRepository}
                />
              }
            />
            <Route 
              path="/work/:id" 
              element={<WorkItemDetail repository={workItemRepository} />} 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
