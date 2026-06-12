import fs from 'fs/promises';
import path from 'path';
import { deleteFromCloudinary } from './cloudinaryHelper.js';

/**
 * Asynchronously deletes a file from the server (or Cloudinary if URL) if it exists.
 * @param {string} pathOrUrl Relative file path (e.g. 'uploads/images/file.jpg') or Cloudinary URL
 * @returns {Promise<void>}
 */
export default async function deleteFile(pathOrUrl) {
  if (!pathOrUrl) return;

  // Check if it's a Cloudinary URL
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      await deleteFromCloudinary(pathOrUrl);
    } catch (error) {
      console.error(`Error deleting Cloudinary file: ${pathOrUrl}`, error);
    }
    return;
  }

  try {
    const absolutePath = path.resolve(process.cwd(), pathOrUrl);
    await fs.unlink(absolutePath);
    console.log(`Successfully deleted physical file: ${absolutePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`File not found at: ${pathOrUrl}. It might have been deleted already.`);
    } else {
      console.error(`Error deleting file: ${pathOrUrl}`, error);
    }
  }
}

