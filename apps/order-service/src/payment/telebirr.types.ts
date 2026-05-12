/**
 * Telebirr Fabric Payment Gateway — request/response shapes (integration layer).
 * Field names follow common Fabric H5 docs; adjust via service if your tenant differs.
 */

/** POST /payment/v1/token (fabric token) — response variants seen across environments */
export type FabricTokenResponse = {
  token?: string;
  access_token?: string;
  result?: { token?: string };
  data?: { token?: string };
  biz_content?: string;
  code?: string;
  msg?: string;
  errorMsg?: string;
};

/** Encrypted business payload before RSA (create order) */
export type TelebirrCreateOrderBizPayload = {
  appId: string;
  notifyUrl: string;
  outTradeNo: string;
  receiveName: string;
  returnUrl: string;
  shortCode: string;
  subject: string;
  timeoutExpress: string;
  totalAmount: string;
  timestamp: string;
  nonce: string;
};

/** Outer create-order request body */
export type TelebirrCreateOrderRequest = {
  appid: string;
  biz_content: string;
  sign: string;
  timestamp: string;
  nonce: string;
};

export type TelebirrCreateOrderResponse = {
  toPayUrl?: string;
  result?: { toPayUrl?: string };
  data?: { toPayUrl?: string };
  code?: string;
  msg?: string;
};

/** Decrypted notify payload (after RSA decrypt of biz_content) */
export type TelebirrNotifyBizPayload = {
  outTradeNo: string;
  tradeNo: string;
  /** e.g. SUCCESS / FAILED */
  tradeStatus: string;
  totalAmount?: string;
};

/** Raw webhook POST body (may be encrypted envelope) */
export type TelebirrWebhookEnvelope = {
  appid?: string;
  biz_content?: string;
  sign?: string;
  timestamp?: string;
  nonce?: string;
};
