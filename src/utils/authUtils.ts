
/**
 * Authentication utility functions
 */

/**
 * Validates and normalizes a role value
 * @param roleValue The role value to validate
 * @returns The validated role ('admin' or 'user')
 */
export const validateRole = (roleValue: string): 'admin' | 'user' => {
  if (roleValue === 'admin') return 'admin';
  return 'user'; // Default to 'user' for any other value
};

/**
 * Normalizes email addresses for authentication
 * @param email The email to normalize
 * @returns Normalized email
 */
export const normalizeEmail = (email: string): string => {
  return email.includes('@') ? email : `${email}@horeca.app`;
};

/**
 * Formats user display name from available data
 * @param email User's email
 * @param metadataName Name from metadata
 * @returns Formatted display name
 */
export const formatDisplayName = (email: string, metadataName?: string): string => {
  if (metadataName) return metadataName;
  if (email) return email.split('@')[0] || 'User';
  return 'User';
};
