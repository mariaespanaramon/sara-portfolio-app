// ============================================================================
// HEXAGONAL ARCHITECTURE - APPLICATION ENTRY POINT
// ============================================================================
// This file wires together all the layers of the hexagonal architecture:
// - Domain: Core business entities (src/application/domain)
// - Application: Use cases / services (src/application/service)
// - Infrastructure: Adapters and ports (src/infrastructure)
// - Presentation: React components (src/presentation/components)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './presentation/components/Header';
import { Hero } from './presentation/components/Hero';
import { WorkSection } from './presentation/components/WorkSection';
import { AboutSection } from './presentation/components/AboutSection';
import { ContactSection } from './presentation/components/ContactSection';
import { Footer } from './presentation/components/Footer';
import { WorkItemDetail } from './presentation/components/WorkItemDetail';
import { MockWorkItemRepository } from './infrastructure/adapters/MockWorkItemRepository';
import { NetlifyBlobsWorkItemRepository } from './infrastructure/adapters/NetlifyBlobsWorkItemRepository';
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

const aboutContentRepository = new MockAboutContentRepository();
const contactDetailsRepository = new MockContactDetailsRepository();

/**
 * Home page component
 */
function HomePage() {
  return (
    <>
      <Hero />
      <WorkSection repository={workItemRepository} />
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
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/work/:slug" 
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
