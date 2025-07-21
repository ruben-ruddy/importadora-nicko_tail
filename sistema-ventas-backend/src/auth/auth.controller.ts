// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Registra un nuevo usuario en el sistema' })
  @ApiBody({ type: RegisterDto, description: 'Datos para el registro de un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Conflicto: nombre de usuario o email ya existen.' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida (errores de validación).' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Inicia sesión y obtiene un token JWT' })
  @ApiBody({ type: LoginDto, description: 'Credenciales de usuario para iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso, devuelve un token JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o usuario inactivo.' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida (errores de validación).' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}