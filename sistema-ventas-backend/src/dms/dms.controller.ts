// src/dms/dms.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Param,
  Delete,
  // Headers, // No olvides descomentar si lo usas
} from '@nestjs/common';
import { DmsService } from './dms.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DmsResponseDto } from './dto/dms-response.dto'; // <-- ¡Importa el DTO!
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('DMS')
@Controller('dms')
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}

  @Post('upload')
  @Roles('Administrador') // Solo administradores pueden crear categorías
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Sube un archivo al Digital Media Storage (DMS)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Archivo DMS subido exitosamente.', type: DmsResponseDto }) // <-- Usa el DTO aquí
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Error al subir el archivo DMS.' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
          new FileTypeValidator({ fileType: 'image/(jpeg|png|gif|webp)' }), // Solo imágenes
        ],
      }),
    )
    file: Express.Multer.File,
    // @Headers('x-user-id') userId?: string, // Ejemplo de cómo pasar el ID de usuario si lo obtienes de un header
    // @Headers('x-module-name') moduleName?: string,
  ): Promise<DmsResponseDto> {
    const uploadedDms = await this.dmsService.uploadFile(file /*, userId, moduleName */);
    return uploadedDms; // Simplemente devuelve el objeto directamente si ya tiene la URL de la DB
  }

  @Get(':id')
  @Roles('Administrador') // Solo administradores pueden crear categorías
  @ApiOperation({ summary: 'Obtiene los metadatos de un archivo DMS por su ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Metadatos del archivo DMS.', type: DmsResponseDto }) // <-- Usa el DTO aquí
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Entrada DMS no encontrada.' })
  async getDmsEntryById(@Param('id') id: string): Promise<DmsResponseDto> {
    const dmsEntry = await this.dmsService.findDmsEntryById(id);
    return dmsEntry; // Simplemente devuelve el objeto directamente si ya tiene la URL de la DB
  }

  @Delete(':id')
  @Roles('Administrador') // Solo administradores pueden crear categorías
  @ApiOperation({ summary: 'Elimina una entrada DMS y su archivo asociado por su ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entrada DMS y archivo eliminados exitosamente.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Entrada DMS no encontrada.' })
  async deleteDmsEntry(@Param('id') id: string) {
    return this.dmsService.deleteDmsEntry(id);
  }
}