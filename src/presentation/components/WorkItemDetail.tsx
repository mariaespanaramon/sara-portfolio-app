import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useWorkItems } from '../../application/service/useWorkItems';
import type { WorkItemRepository } from '../../infrastructure/ports/repositories';
import { WorkItemDetailFactory } from './workItemDetails/WorkItemDetailFactory';

interface WorkItemDetailProps {
  repository: WorkItemRepository;
}

/**
 * Work item detail page component
 * Displays full project details with image on left and info on right
 */
export function WorkItemDetail({ repository }: WorkItemDetailProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { workItems, loading, error } = useWorkItems(repository);

  // Scroll to top when component mounts or slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const handleBackToWork = () => {
    navigate('/');
    // Use setTimeout to ensure navigation completes before scrolling
    setTimeout(() => {
      const workSection = document.getElementById('work');
      if (workSection) {
        workSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-dark-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary font-light">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-light">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Find the work item by slug
  const workItem = workItems.find(
    (item) => item.title.toLowerCase().replace(/\s+/g, '-') === slug
  );

  if (!workItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark-text-secondary font-light mb-4">Project not found</p>
          <button
            onClick={handleBackToWork}
            className="px-6 py-2 border border-dark-border hover:border-dark-text-muted transition-colors"
          >
            Back to Work
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Back button */}
        <button
          onClick={handleBackToWork}
          className="mb-8 text-dark-text-secondary hover:text-dark-text-primary transition-colors flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Work</span>
        </button>

        {/* Single column layout: Media on top, centered */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Media Section - Rendered by type-specific implementation */}
          <div className="aspect-video overflow-hidden bg-dark-surface">
            {WorkItemDetailFactory.getRenderer(workItem.type).renderMedia(workItem)}
          </div>

          {/* Details Section */}
          <div className="space-y-8">
            {/* Title */}
            <h1 className="font-title text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-tight">
              {workItem.title}
            </h1>

            {/* Category and Year */}
            <div className="flex items-center gap-4 text-sm text-dark-text-muted font-light tracking-widest uppercase">
              <span>{workItem.category}</span>
              <span>•</span>
              <span>{workItem.year}</span>
            </div>

            {/* Description */}
            <p className="text-lg lg:text-xl text-dark-text-secondary font-light leading-relaxed whitespace-pre-line">
              {workItem.description}
            </p>

            {/* Tags */}
            <div>
              <div className="flex flex-wrap gap-3">
                {workItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 text-sm font-bold tracking-wide text-dark-text-primary uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
