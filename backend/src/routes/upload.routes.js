const express = require('express');
const { uploadImage, uploadImages, uploadDocument } = require('../controllers/upload.controller');
const {
  uploadImage: uploadImageMiddleware,
  uploadDocument: uploadDocMiddleware,
  handleUploadError,
} = require('../middleware/upload.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

const router = express.Router();

router.post(
  '/image',
  authMiddleware,
  adminOnly,
  uploadImageMiddleware.single('image'),
  handleUploadError,
  uploadImage
);
router.post(
  '/images',
  authMiddleware,
  adminOnly,
  uploadImageMiddleware.array('images', 12),
  handleUploadError,
  uploadImages
);
router.post('/document', uploadDocMiddleware.single('document'), handleUploadError, uploadDocument);

module.exports = router;
