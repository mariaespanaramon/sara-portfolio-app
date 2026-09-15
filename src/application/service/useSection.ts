import { useState, useEffect } from 'react';
import type { Section } from '../domain/Section';
import type { SectionRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for resolving a single section from its slug.
 *
 * `section` is null both while loading and when the slug matches nothing, so
 * callers must check `loading` before treating null as "not found".
 */
export function useSection(repository: SectionRepository, slug: string | undefined) {
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSection = async () => {
      if (!slug) {
        setSection(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const found = await repository.getBySlug(slug);
        if (isMounted) {
          setSection(found);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch section');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSection();

    return () => {
      isMounted = false;
    };
  }, [repository, slug]);

  return { section, loading, error };
}
