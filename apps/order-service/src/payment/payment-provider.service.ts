import { Injectable } from '@nestjs/common';
import { createHmac, createVerify, timingSafeEqual } from 'node:crypto';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class TelebirrPaymentProviderService implements PaymentProvider {
  verifyTelebirrCallbackSignature(
    rawPayload: string,
    signature: string,
  ): boolean {
    const publicKey = process.env.TELEBIRR_PUBLIC_KEY;
    if (publicKey) {
      try {
        const verifier = createVerify('RSA-SHA256');
        verifier.update(rawPayload);
        verifier.end();
        const sanitized = signature.replace(/^base64:/, '');
        if (verifier.verify(publicKey, sanitized, 'base64')) {
          return true;
        }
      } catch {
        // Fall through to HMAC compatibility mode.
      }
    }

    // Compatibility mode for local/dev and provider sandbox variants.
    const secret = process.env.TELEBIRR_APP_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      return false;
    }
    const expected = createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, signatureBuf);
  }
}
