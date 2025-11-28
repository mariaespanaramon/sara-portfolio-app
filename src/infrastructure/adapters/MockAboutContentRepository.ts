import type { AboutContent } from '../../application/domain/AboutContent';
import type { AboutContentRepository } from '../ports/repositories';

/**
 * Mock data for about content
 */
const MOCK_ABOUT_CONTENT: AboutContent = {
  id: '1',
  name: 'Creative Professional',
  role: 'Designer & Developer',
  bio: 'A multidisciplinary creative with a passion for crafting exceptional digital experiences. Specializing in brand identity, user interface design, and frontend development with a focus on minimalism and attention to detail.',
  email: 'hello@example.com',
  location: 'San Francisco, CA',
  skills: [
    'Brand Identity',
    'UI/UX Design',
    'Frontend Development',
    'Typography',
    'Art Direction',
    'Motion Design',
  ],
};

/**
 * Adapter for AboutContent repository - Mock implementation
 * Simulates an asynchronous API call to fetch about content
 * 
 * In production, replace with actual API endpoint
 */
export class MockAboutContentRepository implements AboutContentRepository {
  async get(): Promise<AboutContent> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_ABOUT_CONTENT;
  }
}
