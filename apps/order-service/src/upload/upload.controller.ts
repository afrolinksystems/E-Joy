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
import { UploadService } from './upload.service';

const imageUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

type UploadRequest = {
  user?: {
    role?: string;
    scope?: string[];
  };
};

/**
 * Merchant-authenticated REST upload (CORS-enabled for admin-web).
 */
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

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
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }
    const response = await this.uploadService.uploadImage(file);
    return { url: response.secure_url };
  }
}
