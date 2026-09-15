import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSection } from '../../application/service/useSection';
import { useWorkItems } from '../../application/service/useWorkItems';
import type {
  SectionRepository,
  WorkItemRepository,
} from '../../infrastructure/ports/repositories';
import { ProjectRow } from './ProjectRow';

interface SectionPageProps {
  sectionRepository: SectionRepository;
  workItemRepository: WorkItemRepository;
}

/**
 * Section page: the section's title over its cover image, followed by every
 * project in that section, one per row on alternating sides.
 */
export function SectionPage({ sectionRepository, workItemRepository }: SectionPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { section, loading: sectionLoading, error: sectionError } = useSection(
    sectionRepository,
    slug
  );
  const { workItems, loading: itemsLoading, error: itemsError } = useWorkItems(
    workItemRepository
  );

  // Scroll to top when arriving or when moving between sections.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const loading = sectionLoading || itemsLoading;
  const error = sectionError ?? itemsError;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-site-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-site-text-secondary font-light">Loading section...</p>
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

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-site-text-secondary font-light mb-4">Section not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-site-border hover:border-site-text-muted transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const projects = workItems.filter((item) => item.sectionSlug === section.slug);

  return (
    <div className="min-h-screen pb-24 lg:pb-32">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Extra top padding: half the title now hangs above the image, and a
            two-line title would otherwise run under the fixed site header. */}
        <header className="pt-40 lg:pt-56 mb-20 lg:mb-32">
          {/*
            The wrapper is sized to the image so the title can be placed against the
            image itself rather than against the whole header, whose top padding would
            otherwise pull "half height" upwards.

            No z-index anywhere here on purpose: a positioned element already paints
            above a static sibling, and the title's blend only reads the image as its
            backdrop while both stay in the same stacking context.
          */}
          <div className="relative md:ml-auto md:w-[70%]">
            {/*
              Before the image in the DOM so that on mobile, where it is not
              positioned, it simply stacks above it.

              From `md` up: `top-0 left-0` is the image's top-left corner and the two
              -50% shifts centre the title on it, so half the text's height hangs above
              the image and half its length sits to the left.

              `whitespace-nowrap` is what keeps that exact. An absolutely positioned box
              shrinks to fit its content, so a single-line title makes half the box equal
              half the text. Allow wrapping and the box instead stays at its full width
              while the lines end short of it, and the share of glyphs that lands on the
              image starts depending on the title's length.

              The font size is therefore viewport relative rather than stepped: the
              longest title has to fit on one line with its left half inside the white
              margin, and 4.5vw satisfies that at every width from `md` up. The cap
              stops it growing past the container on very wide screens.
            */}
            <h1 className="md:absolute md:top-0 md:left-0 md:w-auto md:-translate-x-1/2 md:-translate-y-1/2 md:whitespace-nowrap font-title font-bold text-5xl md:text-[min(4.5vw,80px)] tracking-tight leading-none mb-8 md:mb-0 text-white mix-blend-exclusion">
              {section.title}
            </h1>

            <img
              src={section.coverImageUrl}
              alt={section.title}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </header>

        {projects.length === 0 ? (
          <p className="text-site-text-secondary font-light text-lg">
            No projects in this section yet.
          </p>
        ) : (
          <div className="space-y-24 lg:space-y-32">
            {projects.map((item, index) => (
              <ProjectRow key={item.id} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
