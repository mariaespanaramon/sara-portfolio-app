import type { ContactDetails } from '../../application/domain/ContactDetails';
import type { ContactDetailsRepository } from '../ports/repositories';

/**
 * Mock data for contact details
 */
const MOCK_CONTACT_DETAILS: ContactDetails = {
  email: 'hello@example.com', // TODO update email
  location: 'Barcelona, Spain',
};

/**
 * Adapter for ContactDetails repository - Mock implementation
 * Simulates an asynchronous API call to fetch contact details
 * 
 * Once content is finalized, replace with actual API endpoint
 */
export class MockContactDetailsRepository implements ContactDetailsRepository {
  async get(): Promise<ContactDetails> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_CONTACT_DETAILS;
  }
}
