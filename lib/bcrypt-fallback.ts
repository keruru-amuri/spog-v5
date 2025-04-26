/**
 * Fallback implementation of bcrypt for environments where native modules can't be loaded
 * This is NOT secure and should only be used for build/deployment environments
 * In production, real bcrypt should be used
 */

import crypto from 'crypto';

/**
 * Hash a password
 * @param password Password to hash
 * @param saltRounds Number of salt rounds (ignored in fallback)
 * @returns Hashed password
 */
export async function hash(password: string, saltRounds: number): Promise<string> {
  // In a real implementation, this would use bcrypt with proper salt rounds
  // This is just a simple hash for build/deployment environments
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return `fallback:${salt}:${hash}`;
}

/**
 * Compare a password with a hash
 * @param password Password to compare
 * @param hash Hash to compare against
 * @returns Whether the password matches the hash
 */
export async function compare(password: string, hashedPassword: string): Promise<boolean> {
  // Handle fallback hashes
  if (hashedPassword.startsWith('fallback:')) {
    const [prefix, salt, storedHash] = hashedPassword.split(':');
    const computedHash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return computedHash === storedHash;
  }
  
  // For real bcrypt hashes, we can't verify without bcrypt
  // In production, this would never happen because real bcrypt would be available
  console.warn('Cannot verify bcrypt hash in fallback mode');
  return false;
}
