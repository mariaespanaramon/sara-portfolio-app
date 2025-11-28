import { useState, useEffect } from 'react';
import type { AboutContent } from '../domain/AboutContent';
import type { AboutContentRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for managing about content state
 * This use case handles fetching and managing the about/bio information
 */
export function useAboutContent(repository: AboutContentRepository) {
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAboutContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const content = await repository.get();
        if (isMounted) {
          setAboutContent(content);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch about content');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAboutContent();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  return { aboutContent, loading, error };
}
