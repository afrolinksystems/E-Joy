export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentProvider {
  verifyTelebirrCallbackSignature(
    rawPayload: string,
    signature: string,
  ): boolean;
}
