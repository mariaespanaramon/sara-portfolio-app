/**
 * Core domain interface representing the about/bio content
 */
export interface AboutContent {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  location: string;
  skills: string[];
}
