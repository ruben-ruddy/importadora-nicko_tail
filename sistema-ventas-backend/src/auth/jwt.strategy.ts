// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User as PrismaUser } from '@prisma/client'; 

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Obtener el secreto de JWT, asegurando de que sea un string definido
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // Valida que el secreto exista, de lo contrario lanza un error de configuración
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Asegura que el token expire y sea invalidado
      secretOrKey: jwtSecret, //  Variable local que ya verificamos que es un string
    });
  }

  async validate(payload: { sub: string; username: string; roles: string[] }) {
    const user = await this.prisma.user.findUnique({
      where: { id_usuario: payload.sub },
      include: { role: true }, 
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado.');
    }

    return {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      roles: [user.role.nombre_rol], // Devuelve los roles como un array de strings
    };
  }
}