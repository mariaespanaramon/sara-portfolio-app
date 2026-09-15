import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useWorkItems } from '../../application/service/useWorkItems';
import type { WorkItemRepository } from '../../infrastructure/ports/repositories';
import { WorkItemDetailFactory } from './workItemDetails/WorkItemDetailFactory';
import { toUrlId } from '../../application/domain/urlId';
import { RevealOnScroll } from './RevealOnScroll';

interface WorkItemDetailProps {
  repository: WorkItemRepository;
}

/**
 * Floating back control.
 *
 * The blend sits on the button, which is the positioned element: its backdrop is
 * then the page behind it. On a child it would only ever see the button.
 */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-28 left-6 lg:left-12 z-40 flex items-center gap-2 font-title font-bold text-white mix-blend-exclusion hover:opacity-60 transition-opacity"
    >
      <span aria-hidden="true">&larr;</span>
      <span>Back</span>
    </button>
  );
}

/**
 * Work item detail page component
 *
 * Opens on the project's media full screen inside a frame, then reveals the title,
 * text and any further media as the page scrolls.
 */
export function WorkItemDetail({ repository }: WorkItemDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workItems, loading, error } = useWorkItems(repository);

  // Scroll to top when component mounts or id changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const handleBack = () => {
    // Going back through history returns to the section the visitor came from.
    // Landing here directly (a shared link) has no history to return to.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-site-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-site-text-secondary font-light">Loading project...</p>
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

  // Find the work item by its URL id
  const workItem = workItems.find((item) => toUrlId(item.title) === id);

  if (!workItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-site-text-secondary font-light mb-4">Project not found</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 border border-site-border hover:border-site-text-muted transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const renderer = WorkItemDetailFactory.getRenderer(workItem.type);
  const bodyMedia = renderer.renderBodyMedia(workItem);

  return (
    <div className="min-h-screen">
      <BackButton onClick={handleBack} />

      {/* Media full screen. The section's padding is the frame. */}
      <section className="h-screen w-full p-4 md:p-8">
        <div className="w-full h-full overflow-hidden border border-site-border bg-site-surface">
          {renderer.renderHeroMedia(workItem)}
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto py-24 lg:py-32 space-y-20 lg:space-y-28">
          <RevealOnScroll>
            <h1 className="font-title font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight mb-6">
              {workItem.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-site-text-muted font-light tracking-widest uppercase">
              <span>{workItem.category}</span>
              <span>&bull;</span>
              <span>{workItem.year}</span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll>
            <p className="text-lg lg:text-xl text-site-text-secondary font-light leading-relaxed whitespace-pre-line">
              {workItem.description}
            </p>
          </RevealOnScroll>

          {bodyMedia && <RevealOnScroll>{bodyMedia}</RevealOnScroll>}

          <RevealOnScroll>
            <div className="flex flex-wrap gap-3">
              {workItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 text-sm font-bold tracking-wide text-site-text-primary uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </div>
  );
}
