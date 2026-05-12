# Telebirr Signature Upgrade Plan

## Current

- Signature verification is pluggable and uses local HMAC placeholder logic for development/e2e.

## Gap to Production

- Must align with official Telebirr callback signature/certificate specification.
- Must support key rotation and dual-key verification during rollout.

## Upgrade Steps

1. Implement `TelebirrSignatureVerifier` with official algorithm.
2. Load provider public keys/certs from secret manager.
3. Add canary mode: verify both old/new implementation and compare result.
4. Switch `PaymentProvider` binding to official verifier.
5. Add contract tests with official callback samples.

## Acceptance Criteria

- Official sample payloads verify successfully.
- Invalid/altered payloads fail verification.
- Existing error contract (`PAYMENT_SIGNATURE_INVALID`) remains unchanged.
