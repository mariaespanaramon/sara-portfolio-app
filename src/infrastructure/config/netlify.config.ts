/**
 * Netlify Blobs Configuration
 * 
 * Following SOLID principles:
 * - Single Responsibility: Only handles Netlify configuration
 * - Dependency Inversion: Provides abstraction for external service configuration
 * 
 * This configuration layer separates infrastructure concerns from business logic
 */

export interface NetlifyBlobsConfig {
  token: string;
  siteId?: string;
}

/**
 * Factory function to create Netlify Blobs configuration
 * Encapsulates environment variable access and validation
 * 
 * Uses NETLIFY_BLOB_ACCESS environment variable
 * 
 * @throws {Error} If NETLIFY_BLOB_ACCESS token is not configured
 */
export function createNetlifyBlobsConfig(): NetlifyBlobsConfig {
  const token = import.meta.env.NETLIFY_BLOB_ACCESS;
  
  if (!token) {
    throw new Error(
      'NETLIFY_BLOB_ACCESS environment variable is required. ' +
      'Please set it in your Netlify dashboard environment variables.'
    );
  }

  return {
    token,
    siteId: import.meta.env.NETLIFY_SITE_ID,
  };
}

/**
 * Validates if Netlify Blobs is properly configured
 * Useful for conditional rendering or feature flags
 */
export function isNetlifyBlobsConfigured(): boolean {
  return !!import.meta.env.NETLIFY_BLOB_ACCESS;
}
