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
          <div className="w-8 h-8 border-2 border-dark-text-muted border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-title text-dark-text-secondary font-light">Loading Sara's story...</p>
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
    <section id="about" className="min-h-screen flex items-center py-20 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16 lg:space-y-24">
            {/* Title */}
            <div>
              <h2 className="font-title text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-tight mb-4">
                {aboutContent.name}
              </h2>
              <p className="text-2xl lg:text-3xl text-dark-text-secondary font-light">
                {aboutContent.role}
              </p>
            </div>

            {/* Bio */}
            <div>
              <p className="text-xl lg:text-2xl text-dark-text-secondary font-light leading-relaxed whitespace-pre-line">
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
