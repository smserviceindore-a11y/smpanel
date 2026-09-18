const cloudinary = require('cloudinary').v2;

const applyCloudinaryConfig = ({ cloudName, apiKey, apiSecret } = {}) => {
  const cloud_name = (cloudName || process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = (apiKey || process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = (apiSecret || process.env.CLOUDINARY_API_SECRET || '').trim();

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  return {
    cloudName: cloud_name,
    apiKey: api_key,
    apiSecret: api_secret,
    configured: Boolean(cloud_name && api_key && api_secret),
  };
};

// Initial config from env (DB overrides applied at runtime via settings)
applyCloudinaryConfig({});

module.exports = cloudinary;
module.exports.applyCloudinaryConfig = applyCloudinaryConfig;
