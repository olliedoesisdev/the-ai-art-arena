// Add this to lib/utils.ts if not already present

import crypto from 'crypto'

/**
 * Hash an IP address for privacy-preserving vote tracking
 * Uses SHA-256 with an optional salt from environment
 */
export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production'
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 32)
}
