
/**
 * Utility functions for handling product colors
 */

/**
 * Normalizes color data from various formats (string, array, etc.) 
 * into a consistent array of strings.
 * Used when fetching data from external sources like Google Sheets.
 * 
 * @param colors The color data to normalize
 * @returns An array of color strings
 */
export function normalizeColors(colors: any): string[] {
  if (!colors) return [];
  
  // If already an array, just trim each element
  if (Array.isArray(colors)) {
    return colors.map(c => String(c).trim()).filter(c => c.length > 0);
  }
  
  // If it's a comma-separated string
  if (typeof colors === 'string') {
    return colors
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);
  }
  
  // For other types, return as a single-element array if not null/undefined
  const val = String(colors).trim();
  return val ? [val] : [];
}
