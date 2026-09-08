import multer, { MulterError } from 'multer';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/helpers';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage();

function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(new AppError(400, 'Only image files are allowed (jpg, jpeg, png, webp)'));
    return;
  }
  cb(null, true);
}

const uploader = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES,
  },
  fileFilter: imageFileFilter,
});

/** Accept up to 10 image files under the field name `images`. */
export const uploadRoomTypeImages = uploader.array('images', MAX_FILES);

/** Accept a single profile image under the field name `avatar`. */
export const uploadAvatarImage = uploader.single('avatar');

/** Map Multer errors to clear AppError messages for the client. */
export function handleUploadError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(400, 'Image must be 5MB or smaller'));
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      next(new AppError(400, 'Too many image files (maximum 10)'));
      return;
    }
    next(new AppError(400, err.message || 'Invalid image upload'));
    return;
  }

  next(err as Error);
}
