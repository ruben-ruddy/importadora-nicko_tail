// src/app.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@ApiTags('General') // Esto agrupa el endpoint en Swagger bajo la etiqueta "General"
@Controller() // Este controlador no tiene un prefijo de ruta (ej. 'users', 'products'), por lo que la ruta será '/'
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get() // Este es el endpoint GET en la raíz de tu API (ej. http://localhost:3000/)
  @UseGuards(AuthGuard('jwt'), RolesGuard) // Aquí aplicamos el guardia de autenticación JWT y el guardia de roles
  @Roles('Administrador') // Aquí especificamos que solo los usuarios con el rol 'Administrador' pueden acceder a esta ruta
  @ApiBearerAuth('access-token') // Decorador de Swagger para indicar que requiere token
  @ApiOperation({ summary: 'Obtiene el mensaje de bienvenida (requiere autenticación y rol de Administrador)' })
  @ApiResponse({ status: 200, description: 'Mensaje de bienvenida.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 403, description: 'Prohibido (no tiene el rol requerido).' })
  getHello(@Request() req): string {
    console.log('Usuario autenticado:', req.user); // Esto te mostrará los datos del usuario en la consola del backend
    return this.appService.getHello();
  }
}