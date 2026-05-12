import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import NodeRSA from 'node-rsa';
import type {
  FabricTokenResponse,
  TelebirrCreateOrderBizPayload,
  TelebirrCreateOrderRequest,
  TelebirrCreateOrderResponse,
  TelebirrNotifyBizPayload,
  TelebirrWebhookEnvelope,
} from './telebirr.types';

const DEFAULT_API_BASE =
  'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway';

@Injectable()
export class TelebirrService {
  private readonly logger = new Logger(TelebirrService.name);

  isConfigured(): boolean {
    const c = this.config();
    return Boolean(
      c.apiBase &&
      c.appId &&
      c.appKey &&
      c.publicKeyPem &&
      c.shortCode &&
      c.notifyUrl,
    );
  }

  private config() {
    return {
      apiBase: (process.env.TELEBIRR_API_BASE ?? DEFAULT_API_BASE).replace(
        /\/$/,
        '',
      ),
      fabricTokenPath:
        process.env.TELEBIRR_FABRIC_TOKEN_PATH ?? '/payment/v1/token',
      createOrderPath:
        process.env.TELEBIRR_CREATE_ORDER_PATH ?? '/payment/v1/createOrder',
      appId: process.env.TELEBIRR_APP_ID?.trim() ?? '',
      appKey: process.env.TELEBIRR_APP_KEY?.trim() ?? '',
      shortCode: process.env.TELEBIRR_SHORT_CODE?.trim() ?? '',
      publicKeyPem:
        process.env.TELEBIRR_PUBLIC_KEY?.replace(/\\n/g, '\n') ?? '',
      privateKeyPem:
        process.env.TELEBIRR_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      notifyUrl: process.env.TELEBIRR_NOTIFY_URL?.trim() ?? '',
      returnUrl:
        process.env.TELEBIRR_RETURN_URL?.trim() ??
        process.env.TELEBIRR_NOTIFY_URL?.trim() ??
        '',
      timeoutExpress: process.env.TELEBIRR_ORDER_TIMEOUT_MIN ?? '30',
    };
  }

  /**
   * Request Fabric authorization token used as Bearer for createOrder.
   * Default body: { fabricAppId, appSecret } — override path via TELEBIRR_FABRIC_TOKEN_PATH.
   */
  async applyFabricToken(): Promise<string> {
    const c = this.config();
    const url = `${c.apiBase}${c.fabricTokenPath}`;
    const body = {
      fabricAppId: c.appId,
      appSecret: c.appKey,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: FabricTokenResponse;
    try {
      json = JSON.parse(text) as FabricTokenResponse;
    } catch {
      this.logger.warn(`Fabric token non-JSON response: ${text.slice(0, 200)}`);
      throw new Error('Fabric token response is not JSON');
    }
    if (!res.ok) {
      throw new Error(
        `Fabric token HTTP ${res.status}: ${json.msg ?? json.errorMsg ?? text}`,
      );
    }
    const token =
      json.token ?? json.access_token ?? json.result?.token ?? json.data?.token;
    if (!token) {
      throw new Error('Fabric token missing in response');
    }
    return token;
  }

  /**
   * RSA encrypt plain text with Telebirr public key (PKCS#1).
   */
  encryptPayloadWithPublicKey(plainUtf8: string): string {
    const c = this.config();
    if (!c.publicKeyPem) {
      throw new Error('TELEBIRR_PUBLIC_KEY is not set');
    }
    const key = new NodeRSA(c.publicKeyPem, 'public');
    key.setOptions({ encryptionScheme: 'pkcs1' });
    return key.encrypt(plainUtf8, 'base64');
  }

  /**
   * HMAC-SHA256 hex signature used for request/wrapper signing with app key.
   */
  signWithAppKey(parts: string): string {
    const secret = this.config().appKey;
    if (!secret) {
      throw new Error('TELEBIRR_APP_KEY is not set');
    }
    return createHmac('sha256', secret).update(parts).digest('hex');
  }

  private signCreateOrderRequest(req: TelebirrCreateOrderRequest): string {
    const raw = `${req.appid}${req.timestamp}${req.nonce}${req.biz_content}`;
    return this.signWithAppKey(raw);
  }

  /**
   * Create H5 payment order; returns checkout URL for the customer browser.
   * @param orderId — used as outTradeNo (must match webhook)
   * @param totalAmountMinor — order total in minor units (e.g. cents)
   */
  async createH5Order(
    orderId: string,
    totalAmountMinor: number,
  ): Promise<{ toPayUrl: string }> {
    const c = this.config();
    if (!this.isConfigured()) {
      throw new Error('Telebirr is not fully configured (check env)');
    }
    const token = await this.applyFabricToken();
    const timestamp = Date.now().toString();
    const nonce = randomUUID();
    const totalAmount = (totalAmountMinor / 100).toFixed(2);
    const biz: TelebirrCreateOrderBizPayload = {
      appId: c.appId,
      notifyUrl: c.notifyUrl,
      outTradeNo: orderId,
      receiveName: 'E-Joy Order',
      returnUrl: c.returnUrl || c.notifyUrl,
      shortCode: c.shortCode,
      subject: `Order ${orderId}`,
      timeoutExpress: c.timeoutExpress,
      totalAmount,
      timestamp,
      nonce,
    };
    const bizJson = JSON.stringify(biz);
    const bizContent = this.encryptPayloadWithPublicKey(bizJson);
    const req: TelebirrCreateOrderRequest = {
      appid: c.appId,
      biz_content: bizContent,
      sign: '',
      timestamp,
      nonce,
    };
    req.sign = this.signCreateOrderRequest(req);
    const url = `${c.apiBase}${c.createOrderPath}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
    });
    const text = await res.text();
    let json: TelebirrCreateOrderResponse;
    try {
      json = JSON.parse(text) as TelebirrCreateOrderResponse;
    } catch {
      this.logger.warn(`createOrder non-JSON: ${text.slice(0, 300)}`);
      throw new Error('Telebirr createOrder response is not JSON');
    }
    if (!res.ok) {
      throw new Error(
        `Telebirr createOrder HTTP ${res.status}: ${json.msg ?? text}`,
      );
    }
    const toPayUrl =
      json.toPayUrl ?? json.result?.toPayUrl ?? json.data?.toPayUrl;
    if (!toPayUrl) {
      throw new Error('Telebirr createOrder: toPayUrl missing');
    }
    return { toPayUrl };
  }

  /**
   * Decrypt biz_content using merchant private key (PEM).
   */
  decryptBizContentWithPrivateKey(encryptedBase64: string): string {
    const c = this.config();
    if (!c.privateKeyPem) {
      throw new Error('TELEBIRR_PRIVATE_KEY is not set');
    }
    const key = new NodeRSA(c.privateKeyPem, 'private');
    key.setOptions({ encryptionScheme: 'pkcs1' });
    return key.decrypt(encryptedBase64, 'utf8');
  }

  /**
   * Verify outer webhook sign (same string scheme as createOrder).
   */
  verifyWebhookEnvelopeSignature(env: TelebirrWebhookEnvelope): boolean {
    const c = this.config();
    if (
      !env.sign ||
      !env.appid ||
      !env.timestamp ||
      !env.nonce ||
      !env.biz_content
    ) {
      return false;
    }
    const expected = createHmac('sha256', c.appKey)
      .update(`${env.appid}${env.timestamp}${env.nonce}${env.biz_content}`)
      .digest('hex');
    try {
      const a = Buffer.from(expected, 'hex');
      const b = Buffer.from(env.sign, 'hex');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  /**
   * Parse notify: encrypted envelope, or plain JSON when TELEBIRR_WEBHOOK_ALLOW_PLAIN=true (dev only).
   */
  parseNotifyPayload(body: unknown): TelebirrNotifyBizPayload {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid webhook body');
    }
    const allowPlain = process.env.TELEBIRR_WEBHOOK_ALLOW_PLAIN === 'true';
    const env = body as TelebirrWebhookEnvelope;
    if (
      allowPlain &&
      'outTradeNo' in env &&
      'tradeNo' in env &&
      'tradeStatus' in env
    ) {
      return {
        outTradeNo: String((env as { outTradeNo: string }).outTradeNo),
        tradeNo: String((env as { tradeNo: string }).tradeNo),
        tradeStatus: String((env as { tradeStatus: string }).tradeStatus),
      };
    }
    if (!env.biz_content) {
      throw new Error('Missing biz_content');
    }
    if (!this.verifyWebhookEnvelopeSignature(env)) {
      throw new Error('Invalid webhook signature');
    }
    const plain = this.decryptBizContentWithPrivateKey(env.biz_content);
    let parsed: unknown;
    try {
      parsed = JSON.parse(plain);
    } catch {
      throw new Error('Notify biz_content is not valid JSON');
    }
    const biz = parsed as Partial<TelebirrNotifyBizPayload>;
    if (!biz.outTradeNo || !biz.tradeNo || !biz.tradeStatus) {
      throw new Error('Notify payload missing outTradeNo/tradeNo/tradeStatus');
    }
    return {
      outTradeNo: String(biz.outTradeNo),
      tradeNo: String(biz.tradeNo),
      tradeStatus: String(biz.tradeStatus),
      totalAmount: biz.totalAmount,
    };
  }
}
