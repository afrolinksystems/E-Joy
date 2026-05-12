# Phase 20 Archive Notes

## Key Commits

- `8c8bde6`: bootstrap baseline
- `a30fe4a`: staff/admin skeleton
- `7149b52`: staff workflow hardening + artifact cleanup
- `158de07`: section13 completion
- `266ccec`: CI prisma-generate gate fix

## CI Recovery Timeline

- Initial failures: customer-web lint purity/type and order-service CI type-check missing generated prisma client.
- Fixes applied in sequence and verified on GitHub Actions.

## MTTR Snapshot

- CI red to green recovery: ~64 minutes (from first failed run to stable green sequence).
- Primary root cause classes:
  - stricter lint rules in CI vs local assumptions
  - missing generated Prisma client step in CI

## Reusable Templates Captured

- Local smoke script: `scripts/local-e2e-smoke.sh`
- Rollback script: `scripts/deploy-rollback.sh`
- Deploy runbook: `docs/deploy-versioned-runbook.md`
- Release notes draft: `docs/releases/v0.1.0-draft.md`
