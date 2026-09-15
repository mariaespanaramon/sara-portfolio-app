import { SectionCard } from './SectionCard';
import { useSections } from '../../application/service/useSections';
import type { SectionRepository } from '../../infrastructure/ports/repositories';

interface SectionGridProps {
  repository: SectionRepository;
}

/**
 * Home page grid of portfolio sections.
 *
 * Replaces the former grid of individual work items: the home lists sections, and
 * each section page lists its own projects.
 *
 * Keeps the `work` id, which the header anchor and the project page's back
 * navigation both target.
 */
export function SectionGrid({ repository }: SectionGridProps) {
  const { sections, loading, error } = useSections(repository);

  if (loading) {
    return (
      <section id="work" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-site-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-site-text-secondary font-light">Loading sections...</p>
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
    <section id="work">
      <div className="w-full max-w-full">
        {/* 1 column on mobile, 3 on desktop, no gaps. Five sections leave two
            cards on the last row, aligned left. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
}
