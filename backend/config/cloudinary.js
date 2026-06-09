const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(base64String, folder = 'ecole-privee') {
  if (!base64String || !base64String.startsWith('data:image')) return base64String;
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error.message);
    return null;
  }
}

async function fetchImageBuffer(url) {
  if (!url) return null;
  if (url.startsWith('http')) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }
  return null;
}

module.exports = { cloudinary, uploadImage, fetchImageBuffer };
