/**
 * Authentication and permission constants for Chordician.
 */
export const OWNER_EMAIL = 'jeshurunselvakumar@gmail.com';
export const OWNER_DEFAULT_NAME = 'Jeshurun Selvakumar (Owner)';

/**
 * Checks whether an account has owner / full edit permissions
 * @param {string} email
 * @param {string} [role]
 * @returns {boolean}
 */
export function isUserOwner(email, role = '') {
  if (!email && !role) return false;
  const emailMatch = (email || '').trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
  const roleMatch = (role || '').trim().toLowerCase() === 'owner';
  return emailMatch || roleMatch;
}
