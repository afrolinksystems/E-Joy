import {
  BadRequestException,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { UploadApiResponse } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import {
  configureCloudinary,
  isCloudinaryConfigured,
} from './cloudinary.provider';

/** Alias for Cloudinary upload API response (secure URL, public_id, etc.). */
export type CloudinaryResponse = UploadApiResponse;

@Injectable()
export class UploadService implements OnModuleInit {
  onModuleInit(): void {
    configureCloudinary();
  }

  uploadImage(file: Express.Multer.File): Promise<CloudinaryResponse> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required (empty buffer)');
    }
    if (!isCloudinaryConfigured()) {
      throw new ServiceUnavailableException(
        'Image upload is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || 'ejoy-products';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          if (!result) {
            reject(new Error('Cloudinary returned an empty result'));
            return;
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
