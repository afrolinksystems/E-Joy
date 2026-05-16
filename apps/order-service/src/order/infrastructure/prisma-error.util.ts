export function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { code?: string }).code === 'P2002';
}
