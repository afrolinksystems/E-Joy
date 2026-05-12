import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 与 main.ts 中 useStaticAssets 指向同一物理目录（apps/order-service/uploads）。
 * 编译后位于 dist/upload-path.js，故 __dirname 为 dist，向上一级即服务根目录。
 */
export const UPLOADS_ROOT = join(__dirname, '..', 'uploads');

export function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_ROOT)) {
    mkdirSync(UPLOADS_ROOT, { recursive: true });
  }
}
