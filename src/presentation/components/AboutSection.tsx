import { useAboutContent } from '../../application/service/useAboutContent';
import type { AboutContentRepository } from '../../infrastructure/ports/repositories';

interface AboutSectionProps {
  repository: AboutContentRepository;
}

/**
 * About section component
 * Displays biographical and contact information
 */
export function AboutSection({ repository }: AboutSectionProps) {
  const { aboutContent, loading, error } = useAboutContent(repository);

  if (loading) {
    return (
      <section id="about" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-site-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-title text-site-text-secondary font-light">Loading Sara's story...</p>
        </div>
      </section>
    );
  }

  if (error || !aboutContent) {
    return (
      <section id="about" className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-title text-red-500 font-light">Error: {error || 'Content not available'}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="flex items-center pt-20 lg:pt-32 pb-10 lg:pb-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16 lg:space-y-24">
            {/* Title */}
            <div>
              {/* Lower case as a presentation rule rather than in the content: the
                  title is data, so its casing should not depend on how it was typed. */}
              <h2 className="font-title text-3xl sm:text-5xl lg:text-6xl font-bold lowercase tracking-tight leading-tight mb-4">
                {aboutContent.name}
              </h2>
              <p className="text-2xl lg:text-2xl text-site-text-secondary font-light">
                {aboutContent.role}
              </p>
            </div>

            {/* Bio */}
            <div>
              <p className="text-xl lg:text-xl text-site-text-secondary font-light leading-relaxed whitespace-pre-line">
                {aboutContent.bio}
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-2xl font-title tracking-widest uppercase text-site-text-muted mb-6">
                Skills
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {aboutContent.skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-6 py-4 text-center text-site-text-primary font-light text-lg"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
