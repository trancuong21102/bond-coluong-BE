/**
 * Converts a string to a URL-friendly slug, handling Vietnamese diacritics.
 * @param {string} str The input string to slugify
 * @returns {string} The formatted slug
 */
export default function slugify(str) {
  if (!str) return '';
  let slug = str.toLowerCase();

  // Replace Vietnamese diacritics with plain ASCII characters
  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a');
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, 'e');
  slug = slug.replace(/[ìíịỉĩ]/g, 'i');
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o');
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, 'u');
  slug = slug.replace(/[ỳýỵỷỹ]/g, 'y');
  slug = slug.replace(/đ/g, 'd');

  // Remove other special characters, keeping letters, numbers, spaces, and hyphens
  slug = slug.replace(/[^a-z0-9\s-]/g, '');

  // Replace multiple spaces or hyphens with a single hyphen
  slug = slug.replace(/[\s-]+/g, '-');

  // Trim hyphens from start and end
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}
