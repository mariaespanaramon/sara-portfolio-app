import { useState, useEffect } from 'react';

// ============================================================================
// DOMAIN LAYER (Core Business Logic)
// ============================================================================
// This layer contains the core business entities and interfaces.
// It has no dependencies on external frameworks or libraries.

/**
 * Core domain interface representing a portfolio work item
 */
interface WorkItem {
  id: string;
  title: string;
  category: string;
  description: string;
  year: string;
  imageUrl: string;
  tags: string[];
}

/**
 * Core domain interface representing the about/bio content
 */
interface AboutContent {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  skills: string[];
}

// ============================================================================
// INFRASTRUCTURE LAYER (Adapters/External Services)
// ============================================================================
// This layer handles external data sources and API integrations.
// In a real application, this would connect to a Headless CMS or API.
// Security Note: API keys should be loaded from environment variables
// (e.g., process.env.VITE_API_KEY for Vite, or Netlify Environment Variables)

/**
 * Mock data adapter simulating a Headless CMS response
 * In production, this would be replaced with actual API calls to services like:
 * - Contentful
 * - Sanity
 * - Strapi
 * - Custom REST/GraphQL API
 */
const MOCK_WORK_ITEMS: WorkItem[] = [
  {
    id: '1',
    title: 'Brand Identity System',
    category: 'Branding',
    description: 'A comprehensive brand identity system for a leading technology startup, including logo design, color palette, typography, and brand guidelines.',
    year: '2024',
    imageUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=800&fit=crop',
    tags: ['Brand Design', 'Identity', 'Visual System'],
  },
  {
    id: '2',
    title: 'E-Commerce Platform',
    category: 'Digital Product',
    description: 'End-to-end design and development of a modern e-commerce platform with seamless user experience and conversion-optimized checkout flow.',
    year: '2024',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop',
    tags: ['UX/UI Design', 'Development', 'E-Commerce'],
  },
  {
    id: '3',
    title: 'Editorial Design',
    category: 'Print',
    description: 'A premium editorial design project featuring minimalist layouts, sophisticated typography, and thoughtful content hierarchy.',
    year: '2023',
    imageUrl: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=800&fit=crop',
    tags: ['Editorial', 'Typography', 'Layout'],
  },
  {
    id: '4',
    title: 'Mobile Application',
    category: 'Digital Product',
    description: 'Native mobile application design focusing on intuitive interactions, smooth animations, and delightful micro-interactions.',
    year: '2023',
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=800&fit=crop',
    tags: ['Mobile Design', 'UX', 'Prototyping'],
  },
];

const MOCK_ABOUT_CONTENT: AboutContent = {
  id: '1',
  name: 'Creative Professional',
  role: 'Designer & Developer',
  bio: 'A multidisciplinary creative with a passion for crafting exceptional digital experiences. Specializing in brand identity, user interface design, and frontend development with a focus on minimalism and attention to detail.',
  email: 'hello@example.com',
  location: 'San Francisco, CA',
  skills: [
    'Brand Identity',
    'UI/UX Design',
    'Frontend Development',
    'Typography',
    'Art Direction',
    'Motion Design',
  ],
};

/**
 * Simulates an asynchronous API call to fetch work items
 * In production, replace with actual API endpoint:
 * const API_KEY = process.env.VITE_CMS_API_KEY;
 * const response = await fetch(`${API_URL}/work-items`, {
 *   headers: { 'Authorization': `Bearer ${API_KEY}` }
 * });
 */
async function getMockWorkItems(): Promise<WorkItem[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  return MOCK_WORK_ITEMS;
}

/**
 * Simulates an asynchronous API call to fetch about content
 * In production, replace with actual API endpoint
 */
async function getMockAboutContent(): Promise<AboutContent> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));
  return MOCK_ABOUT_CONTENT;
}

// ============================================================================
// APPLICATION LAYER (Use Cases/Business Logic)
// ============================================================================
// This layer contains the application-specific business logic and use cases.
// It orchestrates the flow of data between the domain and infrastructure layers.

/**
 * Custom hook for managing work items state
 * This use case handles fetching and managing the portfolio work items
 */
function useWorkItems() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await getMockWorkItems();
        if (isMounted) {
          setWorkItems(items);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch work items');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWorkItems();

    return () => {
      isMounted = false;
    };
  }, []);

  return { workItems, loading, error };
}

/**
 * Custom hook for managing about content state
 * This use case handles fetching and managing the about/bio information
 */
function useAboutContent() {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAboutContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const content = await getMockAboutContent();
        if (isMounted) {
          setAboutContent(content);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch about content');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAboutContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { aboutContent, loading, error };
}

// ============================================================================
// PRESENTATION LAYER (React Components/UI)
// ============================================================================
// This layer contains the UI components and presentation logic.
// Components only interact with the application layer (use cases).

/**
 * Header component with navigation
 * Features a fixed, transparent header with permanent visible menu
 */
function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 lg:px-12 py-6 lg:py-8">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="#"
            className="text-xl lg:text-2xl font-light tracking-tight hover:opacity-70 transition-opacity"
          >
            Portfolio
          </a>

          {/* Navigation Links - Always visible, not a hamburger menu */}
          <div className="flex items-center gap-8 lg:gap-12">
            <a
              href="#work"
              className="text-sm lg:text-base font-light tracking-wide hover:text-dark-text-secondary transition-colors"
            >
              Work
            </a>
            <a
              href="#about"
              className="text-sm lg:text-base font-light tracking-wide hover:text-dark-text-secondary transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}

/**
 * Hero section component
 */
function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 lg:px-12">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none mb-6 lg:mb-8">
          Crafting Digital
          <br />
          <span className="text-dark-text-secondary">Experiences</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-dark-text-secondary font-light max-w-3xl mx-auto leading-relaxed">
          A collection of selected works in design, branding, and development
        </p>
      </div>
    </section>
  );
}

/**
 * Work item card component
 * Displays a large, visually driven project card
 */
interface WorkItemCardProps {
  item: WorkItem;
  index: number;
}

function WorkItemCard({ item, index }: WorkItemCardProps) {
  const isEven = index % 2 === 0;

  return (
    <article className="min-h-screen flex items-center py-20 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
            isEven ? '' : 'lg:grid-flow-dense'
          }`}
        >
          {/* Image */}
          <div
            className={`relative aspect-[4/3] overflow-hidden bg-dark-surface ${
              isEven ? '' : 'lg:col-start-2'
            }`}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>

          {/* Content */}
          <div className={isEven ? '' : 'lg:col-start-1 lg:row-start-1'}>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm text-dark-text-muted font-light tracking-widest uppercase">
                <span>{item.category}</span>
                <span>•</span>
                <span>{item.year}</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-tight">
                {item.title}
              </h2>

              <p className="text-lg lg:text-xl text-dark-text-secondary font-light leading-relaxed">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-3 pt-4">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 text-xs font-light tracking-wide border border-dark-border text-dark-text-secondary hover:border-dark-text-muted transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Work section component
 * Displays all portfolio work items
 */
function WorkSection() {
  const { workItems, loading, error } = useWorkItems();

  if (loading) {
    return (
      <section id="work" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-dark-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary font-light">Loading projects...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="work" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-light">Error: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="work" className="relative">
      {workItems.map((item, index) => (
        <WorkItemCard key={item.id} item={item} index={index} />
      ))}
    </section>
  );
}

/**
 * About section component
 * Displays biographical and contact information
 */
function AboutSection() {
  const { aboutContent, loading, error } = useAboutContent();

  if (loading) {
    return (
      <section id="about" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-dark-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary font-light">Loading about content...</p>
        </div>
      </section>
    );
  }

  if (error || !aboutContent) {
    return (
      <section id="about" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-light">Error: {error || 'Content not available'}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="min-h-screen flex items-center py-20 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16 lg:space-y-24">
            {/* Title */}
            <div>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-tight mb-4">
                {aboutContent.name}
              </h2>
              <p className="text-2xl lg:text-3xl text-dark-text-secondary font-light">
                {aboutContent.role}
              </p>
            </div>

            {/* Bio */}
            <div>
              <p className="text-xl lg:text-2xl text-dark-text-secondary font-light leading-relaxed">
                {aboutContent.bio}
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-sm font-light tracking-widest uppercase text-dark-text-muted mb-6">
                Expertise
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {aboutContent.skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-6 py-4 border border-dark-border text-center text-dark-text-secondary font-light hover:border-dark-text-muted transition-colors"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-dark-border">
              <div>
                <h3 className="text-sm font-light tracking-widest uppercase text-dark-text-muted mb-3">
                  Email
                </h3>
                <a
                  href={`mailto:${aboutContent.email}`}
                  className="text-lg font-light hover:text-dark-text-secondary transition-colors"
                >
                  {aboutContent.email}
                </a>
              </div>
              <div>
                <h3 className="text-sm font-light tracking-widest uppercase text-dark-text-muted mb-3">
                  Location
                </h3>
                <p className="text-lg font-light text-dark-text-secondary">{aboutContent.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Footer component
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-dark-border py-12 lg:py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-dark-text-muted font-light">
            © {currentYear} Portfolio. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dark-text-muted hover:text-dark-text-secondary transition-colors font-light"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dark-text-muted hover:text-dark-text-secondary transition-colors font-light"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dark-text-muted hover:text-dark-text-secondary transition-colors font-light"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Main App component
 * Orchestrates all presentation components
 */
function App() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      <main>
        <Hero />
        <WorkSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
