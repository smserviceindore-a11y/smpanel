const cloudinary = require('../config/cloudinary');
const { getCloudinaryConfig } = require('../services/settings.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const uploadToCloudinary = (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `sm-global-hub/${folder}`,
      resource_type: resourceType === 'raw' ? 'raw' : 'image',
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    stream.end(buffer);
  });
};

const ensureCloudinary = async () => {
  const cfg = await getCloudinaryConfig();
  if (!cfg.configured) {
    const err = new Error('Cloudinary not configured. Set keys in Super Admin → Settings.');
    err.statusCode = 503;
    throw err;
  }
  return cfg;
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided', 400);
    }

    await ensureCloudinary();
    const result = await uploadToCloudinary(req.file.buffer, 'screenshots');

    sendSuccess(
      res,
      {
        url: result.secure_url,
        publicId: result.public_id,
      },
      'Image uploaded successfully',
      201
    );
  } catch (error) {
    if (error.statusCode === 503) return sendError(res, error.message, 503);
    next(error);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return sendError(res, 'No image files provided', 400);
    }

    await ensureCloudinary();

    const uploaded = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'screenshots');
      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
      });
    }

    sendSuccess(res, uploaded, `${uploaded.length} image(s) uploaded`, 201);
  } catch (error) {
    if (error.statusCode === 503) return sendError(res, error.message, 503);
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No document file provided', 400);
    }

    await ensureCloudinary();
    const result = await uploadToCloudinary(req.file.buffer, 'documents', 'raw');

    sendSuccess(
      res,
      {
        url: result.secure_url,
        name: req.file.originalname,
        type: req.file.mimetype,
        publicId: result.public_id,
      },
      'Document uploaded successfully',
      201
    );
  } catch (error) {
    if (error.statusCode === 503) return sendError(res, error.message, 503);
    next(error);
  }
};

module.exports = { uploadImage, uploadImages, uploadDocument };
