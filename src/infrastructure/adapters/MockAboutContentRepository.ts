import type { AboutContent } from '../../application/domain/AboutContent';
import type { AboutContentRepository } from '../ports/repositories';

/**
 * Mock data for about content
 */
const MOCK_ABOUT_CONTENT: AboutContent = {
  id: '1',
  name: 'About Sara',
  role: 'Design student at BAU, College of Arts & Design Barcelona',
  bio: 'Born in Barcelona, Sara is a multidisciplinary designer, with a passion for crafting engaging visual experiences.\nSpecializing in photography, short film design, and brand identity, with a strong focus on storytelling and visual coherence.\n\nOpen to new projects and eager to explore professional opportunities in design and media.',
  email: 'hello@example.com', // TODO update email
  location: 'Barcelona, Spain',
  skills: [
    'Photography',
    'Art Direction',
    'Motion Design',
    'Brand Identity',
    'UI/UX Design',
  ],
};

/**
 * Adapter for AboutContent repository - Mock implementation
 * Simulates an asynchronous API call to fetch about content
 * 
 * Once content is finalized, replace with actual API endpoint
 */
export class MockAboutContentRepository implements AboutContentRepository {
  async get(): Promise<AboutContent> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_ABOUT_CONTENT;
  }
}
