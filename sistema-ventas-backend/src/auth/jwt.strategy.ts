// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { User as PrismaUser } from '@prisma/client'; // Importa el tipo User de Prisma con alias

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Obtén el secreto de JWT y asegúrate de que sea un string definido
    const jwtSecret = configService.get<string>('JWT_SECRET');

    // Valida que el secreto exista, de lo contrario lanza un error de configuración
    if (!jwtSecret) {
      throw new Error('JWT_SECRET no está definido en las variables de entorno.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Asegura que el token expire y sea invalidado
      secretOrKey: jwtSecret, // Usa la variable local que ya verificamos que es un string
    });
  }

  // Este método se llama después de que el token JWT es validado por su firma y expiración.
  // El 'payload' es el objeto que firmaste al crear el token (sub, username, roles).
  async validate(payload: { sub: string; username: string; roles: string[] }) {
    // 'sub' es el id_usuario en nuestro caso
    const user = await this.prisma.user.findUnique({
      where: { id_usuario: payload.sub },
      include: { role: true }, // Incluye el rol para verificarlo más adelante
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado.');
    }

    // Retorna el usuario completo (o los datos que necesites)
    // Esto se adjuntará al objeto `request` como `req.user`
    return {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      roles: [user.role.nombre_rol], // Devuelve los roles como un array de strings
    };
  }
}