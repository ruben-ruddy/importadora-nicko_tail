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

} from '@nestjs/common';
import { DmsService } from './dms.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DmsResponseDto } from './dto/dms-response.dto'; 
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('DMS')
@Controller('dms')
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}
// Endpoint para subir un archivo al DMS
  @Post('upload')
  @Roles('Administrador') 
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
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Archivo DMS subido exitosamente.', type: DmsResponseDto }) 
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
  ): Promise<DmsResponseDto> {
    const uploadedDms = await this.dmsService.uploadFile(file /*, userId, moduleName */);
    return uploadedDms; // Simplemente devuelve el objeto directamente si ya tiene la URL de la DB
  }
// Endpoint para obtener los metadatos de un archivo DMS por su ID
  @Get(':id')
  @Roles('Administrador') 
  @ApiOperation({ summary: 'Obtiene los metadatos de un archivo DMS por su ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Metadatos del archivo DMS.', type: DmsResponseDto }) 
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Entrada DMS no encontrada.' })
  async getDmsEntryById(@Param('id') id: string): Promise<DmsResponseDto> {
    const dmsEntry = await this.dmsService.findDmsEntryById(id);
    return dmsEntry; 
  }
 // Endpoint para eliminar una entrada DMS y su archivo asociado por su ID
  @Delete(':id')
  @Roles('Administrador') 
  @ApiOperation({ summary: 'Elimina una entrada DMS y su archivo asociado por su ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Entrada DMS y archivo eliminados exitosamente.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Entrada DMS no encontrada.' })
  async deleteDmsEntry(@Param('id') id: string) {
    return this.dmsService.deleteDmsEntry(id);
  }
}