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
    <section id="work" className="relative">
      {workItems.map((item, index) => (
        <WorkItemCard key={item.id} item={item} index={index} />
      ))}
    </section>
  );
}
