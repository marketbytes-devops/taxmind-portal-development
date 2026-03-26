/**
 * Blog utility functions for auto-generating slug and SEO fields
 */

/**
 * Generate a URL-friendly slug from a title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generate unique slug by checking database for duplicates
 */
export const generateUniqueSlug = async (
  title: string,
  // eslint-disable-next-line no-unused-vars
  checkSlugExists: (slug: string) => Promise<boolean>
): Promise<string> => {
  let baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (await checkSlugExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Generate SEO title from blog title
 * Max 60 characters for optimal SEO
 */
export const generateSeoTitle = (title: string): string => {
  const maxLength = 60;
  if (title.length <= maxLength) {
    return title;
  }
  return title.substring(0, maxLength - 3) + '...';
};

/**
 * Generate SEO description from content and excerpt
 * Max 160 characters for optimal SEO
 */
export const generateSeoDescription = (content: string, excerpt?: string): string => {
  const maxLength = 160;

  // Prefer excerpt if available
  if (excerpt) {
    if (excerpt.length <= maxLength) {
      return excerpt;
    }
    return excerpt.substring(0, maxLength - 3) + '...';
  }

  // Strip HTML tags and get plain text from content
  const plainText = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find last complete word within limit
  const truncated = plainText.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    // If last space is reasonably close to limit
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
};

/**
 * Generate SEO keywords from title and content
 * Returns comma-separated keywords
 */
export const generateSeoKeywords = (title: string, content: string): string => {
  // Common Irish tax-related keywords to prioritize
  const taxKeywords = [
    'irish tax',
    'ireland tax',
    'revenue',
    'tax filing',
    'tax return',
    'paye',
    'self assessment',
    'business tax',
    'vat',
    'corporation tax',
    'capital gains',
    'income tax',
    'tax advice',
    'tax planning',
  ];

  // Extract words from title and content
  const allText = `${title} ${content}`.toLowerCase();
  const words = allText
    .replace(/[^\w\s]/g, '') // Remove special characters
    .split(/\s+/)
    .filter((word) => word.length > 3) // Only words longer than 3 characters
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates

  // Find tax-related keywords that appear in content
  const foundTaxKeywords = taxKeywords.filter((keyword) => allText.includes(keyword.toLowerCase()));

  // Get most frequent words (simple frequency analysis)
  const wordFreq: { [key: string]: number } = {};
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const frequentWords = Object.entries(wordFreq)
    .filter(([word]) => word.length > 4) // Only longer words
    .sort(([, a], [, b]) => b - a) // Sort by frequency
    .slice(0, 5) // Top 5 frequent words
    .map(([word]) => word);

  // Combine tax keywords and frequent words
  const allKeywords = [...foundTaxKeywords, ...frequentWords]
    .slice(0, 8) // Limit to 8 keywords
    .join(', ');

  return allKeywords || 'tax, ireland';
};

/**
 * Generate canonical URL from slug
 */
export const generateCanonicalUrl = (slug: string): string => {
  const baseUrl = process.env.FRONTEND_URL || 'https://taxmind.ie';
  return `${baseUrl}/blogs/${slug}`;
};

/**
 * Calculate reading time in minutes (average 200 words per minute)
 */
export const calculateReadingTime = (content: string): number => {
  const plainText = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  const wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length;
  return Math.ceil(wordCount / 200);
};
