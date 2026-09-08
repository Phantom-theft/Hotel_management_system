import { Readable } from 'stream';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { AppError } from '../utils/helpers';

export async function uploadImageBuffer(
  buffer: Buffer,
  originalName: string,
  folder = 'hotel/room-types',
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      503,
      'Image upload is not configured. Set CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
    );
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        original_filename: originalName,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(new AppError(502, 'Failed to upload image to Cloudinary'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(upload);
  });
}

export async function uploadImageFiles(
  files: Express.Multer.File[] | undefined,
): Promise<string[]> {
  if (!files?.length) return [];
  return Promise.all(files.map((file) => uploadImageBuffer(file.buffer, file.originalname)));
}

export async function uploadAvatarFile(file: Express.Multer.File): Promise<string> {
  return uploadImageBuffer(file.buffer, file.originalname, 'hotel/avatars');
}
