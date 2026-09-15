import { useState, useEffect } from 'react';
import type { Section } from '../domain/Section';
import type { SectionRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for resolving a single section from its id.
 *
 * `section` is null both while loading and when the id matches nothing, so
 * callers must check `loading` before treating null as "not found".
 */
export function useSection(repository: SectionRepository, id: string | undefined) {
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSection = async () => {
      if (!id) {
        setSection(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const found = await repository.getById(id);
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
  }, [repository, id]);

  return { section, loading, error };
}
