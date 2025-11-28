import { useState, useEffect } from 'react';
import type { WorkItem } from '../domain/WorkItem';
import type { WorkItemRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for managing work items state
 * This use case handles fetching and managing the portfolio work items
 */
export function useWorkItems(repository: WorkItemRepository) {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await repository.getAll();
        if (isMounted) {
          setWorkItems(items);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch work items');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchWorkItems();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  return { workItems, loading, error };
}
