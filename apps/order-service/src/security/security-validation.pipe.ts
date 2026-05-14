import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const HTML_TAG = /<[^>]+>/;
const MAX_STRING_LENGTH = 4000;

function hasControlCharacters(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (
      (code >= 0 && code <= 8) ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127
    ) {
      return true;
    }
  }
  return false;
}

@Injectable()
export class SecurityValidationPipe implements PipeTransform {
  transform(value: unknown): unknown {
    return this.clean(value, '$');
  }

  private clean(value: unknown, path: string): unknown {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > MAX_STRING_LENGTH) {
        throw new BadRequestException(`${path} is too long`);
      }
      if (hasControlCharacters(trimmed)) {
        throw new BadRequestException(`${path} contains invalid characters`);
      }
      if (HTML_TAG.test(trimmed)) {
        throw new BadRequestException(`${path} must not contain HTML`);
      }
      return trimmed;
    }
    if (Array.isArray(value)) {
      if (value.length > 500) {
        throw new BadRequestException(`${path} has too many items`);
      }
      return value.map((item, index) => this.clean(item, `${path}[${index}]`));
    }
    if (value && typeof value === 'object') {
      const proto = Object.getPrototypeOf(value);
      if (proto !== Object.prototype && proto !== null) {
        return value;
      }
      const out: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(value)) {
        if (
          key === '__proto__' ||
          key === 'constructor' ||
          key === 'prototype'
        ) {
          throw new BadRequestException(`${path}.${key} is not allowed`);
        }
        out[key] = this.clean(entry, `${path}.${key}`);
      }
      return out;
    }
    return value;
  }
}
