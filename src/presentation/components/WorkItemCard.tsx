import type { WorkItem } from '../../application/domain/WorkItem';

/**
 * Work item card component
 * Displays a large, visually driven project card
 */
interface WorkItemCardProps {
  item: WorkItem;
  index: number;
}

export function WorkItemCard({ item, index }: WorkItemCardProps) {
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
