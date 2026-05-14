import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimitService } from '../auth/rate-limit.service';
import { UploadService } from './upload.service';

const imageUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

type UploadRequest = {
  user?: {
    role?: string;
    scope?: string[];
    id?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
};

/**
 * Merchant-authenticated REST upload (CORS-enabled for admin-web).
 */
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly rateLimit: RateLimitService,
  ) {}

  private assertCanUpload(req: UploadRequest) {
    const role = req.user?.role?.toLowerCase();
    const scopes = req.user?.scope ?? [];
    if (
      role === 'admin' ||
      role === 'platform_admin' ||
      role === 'manager' ||
      scopes.includes('staff:write')
    ) {
      return;
    }
    throw new ForbiddenException('You do not have permission to upload images');
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(imageUpload)
  async uploadImage(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: UploadRequest,
  ) {
    this.assertCanUpload(req);
    this.rateLimit.consume({
      key: `${this.rateLimit.getClientIp(req)}:${req.user?.id ?? 'unknown'}`,
      label: 'upload_image',
      limit: 20,
      windowMs: 60_000,
    });
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    this.assertSafeImage(file);
    const response = await this.uploadService.uploadImage(file);
    return { url: response.secure_url };
  }

  private assertSafeImage(file: Express.Multer.File): void {
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, or GIF images are allowed',
      );
    }
    const name = file.originalname.toLowerCase();
    if (!/\.(jpe?g|png|webp|gif)$/.test(name)) {
      throw new BadRequestException('Image extension is not allowed');
    }
    const b = file.buffer;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const isPng =
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    const isGif = b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46;
    const isWebp =
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50;
    if (!(isJpeg || isPng || isGif || isWebp)) {
      throw new BadRequestException(
        'Image content does not match an allowed format',
      );
    }
  }
}
