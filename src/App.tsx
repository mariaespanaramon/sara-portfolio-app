// ============================================================================
// HEXAGONAL ARCHITECTURE - APPLICATION ENTRY POINT
// ============================================================================
// This file wires together all the layers of the hexagonal architecture:
// - Domain: Core business entities (src/application/domain)
// - Application: Use cases / services (src/application/service)
// - Infrastructure: Adapters and ports (src/infrastructure)
// - Presentation: React components (src/presentation/components)

import { Header } from './presentation/components/Header';
import { Hero } from './presentation/components/Hero';
import { WorkSection } from './presentation/components/WorkSection';
import { AboutSection } from './presentation/components/AboutSection';
import { Footer } from './presentation/components/Footer';
import { MockWorkItemRepository } from './infrastructure/adapters/MockWorkItemRepository';
import { MockAboutContentRepository } from './infrastructure/adapters/MockAboutContentRepository';

// Initialize repositories (dependency injection)
// In a larger application, you might use a DI container or React Context
const workItemRepository = new MockWorkItemRepository();
const aboutContentRepository = new MockAboutContentRepository();

/**
 * Main App component
 * Orchestrates all presentation components and injects dependencies
 */
function App() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <main>
        <Hero />
        <WorkSection repository={workItemRepository} />
        <AboutSection repository={aboutContentRepository} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
