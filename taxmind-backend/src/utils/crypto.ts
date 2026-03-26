import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const SECRET = process.env.ENCRYPTION_SECRET_KEY!;
const HMAC_KEY = process.env.HMAC_SECRET_KEY!;

export function encrypt(text: string) {
  const KEY = Buffer.from(SECRET, 'hex');
  const iv = randomBytes(32);
  const cipher = createCipheriv(algorithm, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(payload: string) {
  const KEY = Buffer.from(SECRET, 'hex');
  const [ivHex, tagHex, data] = payload.split(':');
  const decipher = createDecipheriv(algorithm, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashWithHMAC(text: string): string {
  return createHmac('sha256', HMAC_KEY).update(text).digest('hex');
}

/**
 * Extract trigrams (3-character sequences) from text using sliding window
 * Example: "john" → ["  j", " jo", "joh", "ohn", "hn ", "n  "]
 */
export function extractTrigrams(text: string): string[] {
  if (!text) return [];

  // Normalize: lowercase and trim
  const normalized = text.toLowerCase().trim();

  // Add padding spaces for proper edge detection
  const padded = `  ${normalized}  `;

  const trigrams: string[] = [];

  // Sliding window: extract all 3-character sequences
  for (let i = 0; i <= padded.length - 3; i++) {
    trigrams.push(padded.substring(i, i + 3));
  }

  // Remove duplicates to reduce storage
  return [...new Set(trigrams)];
}

/**
 * Convert text to array of hashed trigrams for searchable storage
 * This allows partial search while maintaining security through hashing
 *
 * @param text - The text to convert (e.g., "john@example.com")
 * @returns Array of hashed trigrams
 *
 * @example
 * hashTrigrams("john")
 * // Returns: ["a1b2c3...", "d4e5f6...", "g7h8i9...", ...]
 */
export function hashTrigrams(text: string): string[] {
  const trigrams = extractTrigrams(text);
  return trigrams.map((trigram) => hashWithHMAC(trigram));
}

/**
 * Hash a search keyword's trigrams for database querying
 * Returns array of hashes to use with PostgreSQL @> (contains) operator
 *
 * For partial search to work, we need to use the && (overlap) operator instead of @> (contains all)
 * This allows matching if ANY trigrams match, not requiring ALL trigrams to match
 *
 * @param keyword - The search term (e.g., "joh")
 * @returns Array of hashed trigrams to search for
 *
 * @example
 * const searchHashes = hashSearchKeyword("joh");
 * // Use in query: WHERE email_trigram_hashes && searchHashes (overlap)
 */
export function hashSearchKeyword(keyword: string): string[] {
  const trigrams = extractTrigrams(keyword);
  console.log('Search trigrams for keyword:', keyword, '→', trigrams);
  return trigrams.map((trigram) => hashWithHMAC(trigram));
}
