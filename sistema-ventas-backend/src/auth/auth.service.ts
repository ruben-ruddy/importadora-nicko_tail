// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

import { HttpService } from '@nestjs/axios'; // <-- Importa HttpService
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private prisma: PrismaService, private jwtService: JwtService, private httpService: HttpService, private configService: ConfigService,) {}

  async register(registerDto: RegisterDto) {
    const { nombre_usuario, email, password, nombre_completo, telefono, id_rol } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ nombre_usuario }, { email }] },
    });

    if (existingUser) {
      if (existingUser.nombre_usuario === nombre_usuario) {
        throw new ConflictException('Nombre de usuario ya registrado.');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email ya registrado.');
      }
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);

    let targetRoleId: string;
    if (id_rol) {
        // Si se proporciona un ID de rol, úsalo directamente (asumiendo que es un UUID válido)
        targetRoleId = id_rol;
    } else {
        // Si no se proporciona, busca el rol 'Vendedor' por su nombre y obtén su UUID
        const defaultRole = await this.prisma.role.findUnique({
            where: { nombre_rol: 'Vendedor' },
            select: { id_rol: true },
        });
        if (!defaultRole) {
            throw new Error('El rol por defecto "Vendedor" no existe. Ejecuta el script de siembra.');
        }
        targetRoleId = defaultRole.id_rol;
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          nombre_usuario,
          email,
          password_hash,
          nombre_completo,
          telefono,
          id_rol: targetRoleId,
          fecha_creacion: new Date(),
          activo: true, // Asegúrate de que el campo activo se establezca por defecto
        },
        select: {
          id_usuario: true,
          nombre_usuario: true,
          email: true,
          nombre_completo: true,
          telefono: true,
          activo: true,
          fecha_creacion: true,
          id_rol: true,
          role: { select: { nombre_rol: true } },
        },
      });
      this.logger.log(`Usuario ${user.nombre_usuario} registrado con éxito.`);
      return user;
    } catch (error) {
      this.logger.error(`Error al registrar usuario: ${error.message}`, error.stack);
      throw new ConflictException('No se pudo registrar el usuario. Verifique los datos.');
    }
  }

  async login(loginDto: LoginDto) {
    const { nombre_usuario, password } = loginDto;
   

    const user = await this.prisma.user.findUnique({
      where: { nombre_usuario },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    if (!user.activo) {
        throw new UnauthorizedException('Su cuenta está inactiva. Contacte al administrador.');
    }

    const payload = {
      sub: user.id_usuario,
      username: user.nombre_usuario,
      roles: [user.role.nombre_rol],
    };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.user.update({
      where: { id_usuario: user.id_usuario },
      data: { ultimo_acceso: new Date() },
    });

    this.logger.log(`Usuario ${user.nombre_usuario} ha iniciado sesión.`);
    //console.log(user);
    return { accessToken,user };
  }

  async validateUser(id_usuario: string): Promise<User | null> { // id_usuario ahora es string
    const user = await this.prisma.user.findUnique({
      where: { id_usuario },
      include: { role: true }
    });
    if (!user || !user.activo) {
      return null;
    }
    return user;
  }
}