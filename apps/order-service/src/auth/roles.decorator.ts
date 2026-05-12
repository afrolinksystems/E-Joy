import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'rbac_roles';

/** Case-insensitive match against JWT `role` (e.g. manager, platform_admin). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
