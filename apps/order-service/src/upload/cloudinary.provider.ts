import { v2 as cloudinary } from 'cloudinary';

/**
 * Parse `cloudinary://api_key:api_secret@cloud_name` (Cloudinary dashboard format).
 */
function parseCloudinaryUrl(url: string): {
  cloud_name: string;
  api_key: string;
  api_secret: string;
} | null {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'cloudinary:') return null;
    const api_key = decodeURIComponent(u.username);
    const api_secret = decodeURIComponent(u.password);
    const cloud_name = u.hostname;
    if (!api_key || !api_secret || !cloud_name) return null;
    return { cloud_name, api_key, api_secret };
  } catch {
    return null;
  }
}

/**
 * Configure Cloudinary from `CLOUDINARY_URL` or
 * `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`.
 * Call once at startup (e.g. UploadService.onModuleInit).
 */
export function configureCloudinary(): void {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return;
  }

  const rawUrl = process.env.CLOUDINARY_URL?.trim();
  if (rawUrl) {
    const parsed = parseCloudinaryUrl(rawUrl);
    if (parsed) {
      cloudinary.config(parsed);
    }
  }
}

export function isCloudinaryConfigured(): boolean {
  const c = cloudinary.config() as {
    cloud_name?: string;
    api_key?: string;
    api_secret?: string;
  };
  return Boolean(c.cloud_name && c.api_key && c.api_secret);
}
