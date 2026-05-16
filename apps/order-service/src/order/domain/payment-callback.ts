import { createHash } from 'node:crypto';
import { DomainError } from './domain-error';

export type CallbackPayload = {
  nonce: string;
  timestamp: number;
  requestId?: string;
  sourceIp?: string;
};

export type CallbackRequestMeta = {
  requestId?: string;
  sourceIp?: string;
};

export function parseAndValidateCallbackPayload(
  rawPayload: string,
): CallbackPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    throw new DomainError(
      'PAYMENT_CALLBACK_INVALID_PAYLOAD',
      'Invalid callback payload',
    );
  }

  const payload = parsed as Partial<CallbackPayload>;
  if (!payload.nonce || typeof payload.nonce !== 'string') {
    throw new DomainError(
      'PAYMENT_CALLBACK_INVALID_PAYLOAD',
      'Missing callback nonce',
    );
  }
  if (
    typeof payload.timestamp !== 'number' ||
    !Number.isFinite(payload.timestamp)
  ) {
    throw new DomainError(
      'PAYMENT_CALLBACK_INVALID_PAYLOAD',
      'Missing callback timestamp',
    );
  }

  const driftMs = Math.abs(Date.now() - payload.timestamp);
  if (driftMs > 5 * 60 * 1000) {
    throw new DomainError(
      'PAYMENT_CALLBACK_EXPIRED',
      'Payment callback is outside allowed time window',
    );
  }

  if (payload.requestId && typeof payload.requestId !== 'string') {
    throw new DomainError(
      'PAYMENT_CALLBACK_INVALID_PAYLOAD',
      'Invalid callback requestId',
    );
  }
  if (payload.sourceIp && typeof payload.sourceIp !== 'string') {
    throw new DomainError(
      'PAYMENT_CALLBACK_INVALID_PAYLOAD',
      'Invalid callback sourceIp',
    );
  }

  return {
    nonce: payload.nonce,
    timestamp: payload.timestamp,
    requestId: payload.requestId,
    sourceIp: payload.sourceIp,
  };
}

export function buildCallbackPayloadHash(rawPayload: string): string {
  return createHash('sha256').update(rawPayload).digest('hex');
}
