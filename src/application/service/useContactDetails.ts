import { useState, useEffect } from 'react';
import type { ContactDetails } from '../domain/ContactDetails';
import type { ContactDetailsRepository } from '../../infrastructure/ports/repositories';

/**
 * Custom hook for managing contact details state
 * This use case handles fetching and managing contact information
 */
export function useContactDetails(repository: ContactDetailsRepository) {
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchContactDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await repository.get();
        if (isMounted) {
          setContactDetails(details);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch contact details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchContactDetails();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  return { contactDetails, loading, error };
}
