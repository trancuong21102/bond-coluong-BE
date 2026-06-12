import cloudinary from '../config/cloudinary.js';

/**
 * Extracts Cloudinary public ID from a secure URL.
 * Supports standard URLs and folder hierarchies.
 * @param {string} url Cloudinary secure URL
 * @returns {string|null} public ID
 */
export const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // E.g. https://res.cloudinary.com/cloud_name/image/upload/v123456789/folder/subfolder/filename.jpg
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  
  let afterUpload = parts[1];
  
  // Remove version prefix (e.g., v1623456789/)
  const versionMatch = afterUpload.match(/^v\d+\/(.+)$/);
  if (versionMatch) {
    afterUpload = versionMatch[1];
  }
  
  // Remove file extension
  const dotIndex = afterUpload.lastIndexOf('.');
  if (dotIndex !== -1) {
    afterUpload = afterUpload.substring(0, dotIndex);
  }
  
  return afterUpload;
};

/**
 * Uploads a local file to Cloudinary and returns its URL and public ID.
 * @param {string} localFilePath Path to the local file
 * @param {string} [folder] Optional folder name in Cloudinary
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = async (localFilePath, folder = 'pinterest') => {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: 'auto',
    });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Deletes an image from Cloudinary by its URL or public ID.
 * @param {string} urlOrPublicId Cloudinary URL or public ID
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (urlOrPublicId) => {
  if (!urlOrPublicId) return;
  
  let publicId = urlOrPublicId;
  if (urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://')) {
    publicId = extractPublicId(urlOrPublicId);
  }
  
  if (!publicId) {
    console.warn(`Could not extract public ID from: ${urlOrPublicId}`);
    return;
  }
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Successfully deleted from Cloudinary: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error(`Error deleting from Cloudinary: ${publicId}`, error);
    throw error;
  }
};
