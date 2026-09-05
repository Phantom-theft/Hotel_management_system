import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

let configured = false;

export function initCloudinary(): boolean {
  if (configured) return true;

  if (env.cloudinary.url) {
    cloudinary.config({ cloudinary_url: env.cloudinary.url });
    configured = Boolean(cloudinary.config().cloud_name);
    return configured;
  }

  if (env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
    return true;
  }

  return false;
}

export function isCloudinaryConfigured(): boolean {
  return initCloudinary();
}

export { cloudinary };
