
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

/**
 * Robust case-insensitive and alternative-friendly key lookup.
 */
export function getFlexibleProperty(obj: any, keys: string[]): any {
  if (!obj) return undefined;
  // Try direct lookup first
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  // Case-insensitive and variation-independent fallback
  const objKeys = Object.keys(obj);
  const normalizedKeyVariants = keys.map(k => k.toLowerCase().replace(/[\s_-]/g, ''));
  for (const ok of objKeys) {
    const normOk = ok.toLowerCase().replace(/[\s_-]/g, '');
    const idx = normalizedKeyVariants.indexOf(normOk);
    if (idx !== -1) {
      return obj[ok];
    }
  }
  return undefined;
}

export function parseBoolean(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    return lower === 'true' || lower === 'on' || lower === '1' || lower === 'yes' || lower === 'featured' || lower === 'comingsoon' || lower === 'coming soon';
  }
  return false;
}

/**
 * Normalizes a raw object (e.g., loaded from a spreadsheet) into a valid Product object.
 * Maps flexible / user-friendly spellings of column keys to their type definitions.
 */
export function normalizeProduct(raw: any): any {
  if (!raw) return null;

  // Retrieve keys very robustly
  const id = getFlexibleProperty(raw, ['id']);
  const name = getFlexibleProperty(raw, ['name', 'title']);
  const description = getFlexibleProperty(raw, ['description', 'desc']);
  const category = getFlexibleProperty(raw, ['category', 'type']);
  const anime = getFlexibleProperty(raw, ['anime', 'series']);
  
  // Images
  const image = getFlexibleProperty(raw, ['image', 'mainImage', 'featuredImage']) || '';
  const images = safeParseJSON(getFlexibleProperty(raw, ['images', 'gallery']));
  
  // Colors and Out Of Stock Colors/Images
  const color = getFlexibleProperty(raw, ['color']);
  const colors = normalizeColors(getFlexibleProperty(raw, ['colors', 'variants']));
  const outOfStockColors = safeParseJSON(getFlexibleProperty(raw, ['outOfStockColors', 'outofstockcolors', 'out_of_stock_colors']));
  const outOfStockImages = safeParseJSON(getFlexibleProperty(raw, ['outOfStockImages', 'outofstockimages', 'out_of_stock_images']));
  
  // Other flags
  const isFeatured = parseBoolean(getFlexibleProperty(raw, ['isFeatured', 'featured', 'isfeatured']));
  const isComingSoon = parseBoolean(getFlexibleProperty(raw, ['isComingSoon', 'comingSoon', 'comingsoon', 'iscomingsoon']));
  const videoUrl = getFlexibleProperty(raw, ['videoUrl', 'video', 'videourl']);

  // REGULAR PRICE vs DISCOUNT PRICE
  let rawPrice = getFlexibleProperty(raw, ['price', 'regularPrice', 'regular_price', 'regular price']);
  let price: number | string = rawPrice;
  if (rawPrice !== undefined && rawPrice !== null && String(rawPrice).trim() !== '') {
    const trimmed = String(rawPrice).trim();
    if (!isNaN(Number(trimmed))) {
      price = Number(trimmed);
    } else {
      price = trimmed;
    }
  } else {
    price = '';
  }

  let rawDiscount = getFlexibleProperty(raw, ['discountPrice', 'discountprice', 'discount_price', 'discount price', 'salePrice', 'sale price', 'saleprice', 'sale_price']);
  let discountPrice: number | string | undefined = undefined;
  if (rawDiscount !== undefined && rawDiscount !== null && String(rawDiscount).trim() !== '') {
    const trimmedDisc = String(rawDiscount).trim();
    if (!isNaN(Number(trimmedDisc))) {
      discountPrice = Number(trimmedDisc);
    } else {
      discountPrice = trimmedDisc;
    }
  }

  return {
    id: id ? String(id) : Math.random().toString(36).substr(2, 9),
    name: name ? String(name) : 'Unnamed Product',
    price,
    discountPrice,
    image,
    images: images.length > 0 ? images : (image ? [image] : []),
    category: category ? String(category) : 'General',
    description: description ? String(description) : '',
    anime: anime ? String(anime) : '',
    color: color ? String(color) : '',
    colors,
    outOfStockColors,
    outOfStockImages,
    isFeatured,
    isComingSoon,
    videoUrl: videoUrl ? String(videoUrl) : ''
  };
}

