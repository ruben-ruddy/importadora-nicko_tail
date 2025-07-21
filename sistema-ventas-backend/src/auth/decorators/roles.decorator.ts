// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Ahora, 'roles' es un array de strings
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);