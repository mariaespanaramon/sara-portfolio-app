import { useState, useEffect } from 'react';
import type { Section } from '../domain/Section';
import type { SectionRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for managing sections state
 * This use case handles fetching and managing the portfolio sections
 */
export function useSections(repository: SectionRepository) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSections = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await repository.getAll();
        if (isMounted) {
          setSections(items);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch sections');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSections();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  return { sections, loading, error };
}
