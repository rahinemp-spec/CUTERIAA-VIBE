
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

/**
 * Extremely robust helper to safely parse JSON or fallback to looser array split patterns.
 * Ensures compatibility with various manual or programmatically created spreadsheet inputs.
 */
export function safeParseJSON(str: any): string[] {
  if (!str) return [];
  if (Array.isArray(str)) {
    return str.map(v => String(v).trim()).filter(Boolean);
  }
  if (typeof str !== 'string') return [];
  const trimmed = str.trim();
  if (!trimmed) return [];
  
  // Try standard JSON parse first
  try {
    const val = JSON.parse(trimmed);
    if (Array.isArray(val)) {
      return val.map(v => String(v).trim()).filter(Boolean);
    }
    if (typeof val === 'string') {
      if (val.includes(',')) {
        return val.split(',').map(v => v.trim()).filter(Boolean);
      }
      return [val.trim()];
    }
    if (val) {
      return [String(val).trim()];
    }
  } catch (e) {
    // ignore and fall through
  }
  
  // Hand-rolled fallback to parse simple comma-separated list or looser bracket arrays
  let rawStr = trimmed;
  if (rawStr.startsWith('[') && rawStr.endsWith(']')) {
    rawStr = rawStr.slice(1, -1);
  }
  
  const items = rawStr.split(',');
  return items.map(item => {
    let clean = item.trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      clean = clean.slice(1, -1).trim();
    }
    clean = clean.replace(/\\'/g, "'").replace(/\\"/g, '"');
    return clean;
  }).filter(Boolean);
}

