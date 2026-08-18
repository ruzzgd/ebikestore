import multer from 'multer';
import asyncHandler from '../../middleware/asyncHandler.js';
import minioProvider from '../../providers/minioProvider.js';
import { BadRequestError } from '../../utils/errors.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestError(`Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are allowed.`));
    }
    cb(null, true);
  },
});

export const multerUploadMiddleware = upload.single('image');

export const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No image file provided in request');
  }

  const objectKey = await minioProvider.uploadImage(req.file.buffer, req.file.mimetype, req.file.originalname);

  res.status(201).json({
    status: 'success',
    data: {
      imageKey: objectKey,
      imageUrl: `/api/v1/uploads/images/${objectKey}`,
    },
  });
});

export const getImageStream = asyncHandler(async (req, res) => {
  const objectKey = req.params[0] || req.params.key;

  if (!objectKey) {
    throw new BadRequestError('Object key is required');
  }

  try {
    const stream = await minioProvider.getObjectStream(objectKey);

    if (objectKey.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (objectKey.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.pipe(res);
  } catch (err) {
    res.status(404).json({ status: 'fail', message: 'Image object not found' });
  }
});

export default {
  multerUploadMiddleware,
  uploadProductImage,
  getImageStream,
};
