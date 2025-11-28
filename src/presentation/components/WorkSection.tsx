import { WorkItemCard } from './WorkItemCard';
import { useWorkItems } from '../../application/service/useWorkItems';
import type { WorkItemRepository } from '../../infrastructure/ports/repositories';

interface WorkSectionProps {
  repository: WorkItemRepository;
}

/**
 * Work section component
 * Displays all portfolio work items
 */
export function WorkSection({ repository }: WorkSectionProps) {
  const { workItems, loading, error } = useWorkItems(repository);

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
    <section id="work" className="py-20 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Grid of work items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {workItems.map((item) => (
            <WorkItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
