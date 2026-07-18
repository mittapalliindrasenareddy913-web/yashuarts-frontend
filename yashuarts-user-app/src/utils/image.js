// Cloudinary image optimization utility

export const optimizeImage = (url, width = 600, height = 600) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  try {
    if (url.includes('/image/upload/w_') || url.includes('/image/upload/c_')) {
      return url;
    }
    const parts = url.split('/image/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/image/upload/w_${width},h_${height},c_limit/${parts[1]}`;
    }
  } catch (e) {
    return url;
  }
  return url;
};

export default optimizeImage;
