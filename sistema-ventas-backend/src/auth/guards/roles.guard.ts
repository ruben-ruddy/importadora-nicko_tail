// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ // Cambiado a string[]
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no hay roles definidos, permite el acceso
    }

    const { user } = context.switchToHttp().getRequest();
    // Importante: Asegúrate de que user.roles sea un array de strings (ej: ['Administrador', 'Vendedor'])
    // Esto lo debe manejar tu JwtStrategy al validar el token y adjuntar el usuario.
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false; // Si el usuario o sus roles no están definidos correctamente, deniega el acceso
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }
}