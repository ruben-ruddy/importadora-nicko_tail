// src/dms/dms.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';
import { DMS } from '@prisma/client';

@Injectable()
export class DmsService {
  private readonly uploadPath = join(__dirname, '..', '..', 'uploads');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, userId?: string, moduleName?: string): Promise<DMS> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }

    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const filePath = join(this.uploadPath, uniqueFilename);
    const fileUrl = `/uploads/${uniqueFilename}`; // URL pública para acceder al archivo

    try {
      fs.writeFileSync(filePath, file.buffer);

      const newDmsEntry = await this.prisma.dMS.create({
        data: {
          fileName: file.originalname,
          mimeType: file.mimetype,
          type: file.mimetype.split('/')[0],
          path: filePath,
          url: fileUrl, // <--- Guardamos la URL aquí
          size: file.size,
          user: userId,
          module: moduleName,
        },
      });
      return newDmsEntry; // newDmsEntry ya incluirá 'url'
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error('Error al guardar archivo o metadatos DMS:', error);
      throw new BadRequestException('Error al procesar el archivo DMS.');
    }
  }

  async findDmsEntryById(id: string): Promise<DMS> {
    const dmsEntry = await this.prisma.dMS.findUnique({
      where: { id },
    });
    if (!dmsEntry) {
      throw new BadRequestException('Entrada DMS no encontrada.');
    }
    return dmsEntry; // dmsEntry ya incluirá 'url'
  }

  async deleteDmsEntry(id: string) {
    const dmsEntry = await this.prisma.dMS.findUnique({ where: { id } });
    if (!dmsEntry) {
      throw new BadRequestException('Entrada DMS no encontrada para eliminar.');
    }

    try {
      if (fs.existsSync(dmsEntry.path)) {
        fs.unlinkSync(dmsEntry.path);
      }
      await this.prisma.dMS.delete({ where: { id } });
      return { message: 'Entrada DMS y archivo eliminados exitosamente.' };
    } catch (error) {
      console.error('Error al eliminar archivo o metadatos DMS:', error);
      throw new BadRequestException('Error al eliminar el archivo DMS.');
    }
  }
}