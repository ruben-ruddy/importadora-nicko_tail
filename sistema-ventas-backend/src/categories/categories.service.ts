// src/categories/categories.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category as PrismaCategory } from '@prisma/client'; // Alias para el tipo Category de Prisma

@Injectable()
export class CategoriesService {
  dmsService: any;
  constructor(private prisma: PrismaService) {}

async create(createCategoryDto: CreateCategoryDto, iconFile?: Express.Multer.File): Promise<PrismaCategory> {
  const existingCategory = await this.prisma.category.findUnique({
    where: { nombre_categoria: createCategoryDto.nombre_categoria },
  });

  if (existingCategory) {
    throw new ConflictException(`La categoría "${createCategoryDto.nombre_categoria}" ya existe.`);
  }

  // 1. Manejo explícito del icono
  let icono_url = createCategoryDto.icono_url || null; // Respeta el valor del DTO o null

  // 2. Subir archivo si existe
  if (iconFile) {
    try {
      const uploadedFile = await this.dmsService.uploadFile(iconFile, null, 'category_icons');
      icono_url = uploadedFile.url;
    } catch (dmsError) {
      console.error('Error al subir el icono:', dmsError);
      throw new ConflictException('Error al subir el icono');
    }
  }

  // 3. Creación con datos explícitos
  return this.prisma.category.create({
    data: {
      nombre_categoria: createCategoryDto.nombre_categoria,
      descripcion: createCategoryDto.descripcion || null, // Manejo explícito
      activo: createCategoryDto.activo ?? true, // Valor por defecto
      icono_url: icono_url // Usa el valor determinado
    }
  });
}


  async findAll(): Promise<PrismaCategory[]> {
    return this.prisma.category.findMany({
      orderBy: { nombre_categoria: 'asc' }, // Opcional: ordenar por nombre
    });
  }

  async findOne(id_categoria: string): Promise<PrismaCategory> {
    const category = await this.prisma.category.findUnique({
      where: { id_categoria },
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id_categoria}" no encontrada.`);
    }
    return category;
  }

async update(
  id_categoria: string,
  updateCategoryDto: UpdateCategoryDto,
  iconFile?: Express.Multer.File
): Promise<PrismaCategory> {
  // 1. Verificar existencia de la categoría
  const existingCategory = await this.prisma.category.findUnique({ 
    where: { id_categoria } 
  });
  if (!existingCategory) {
    throw new NotFoundException(`Categoría con ID "${id_categoria}" no encontrada`);
  }

  // 2. Verificar conflicto de nombre (si se está cambiando)
  if (updateCategoryDto.nombre_categoria && updateCategoryDto.nombre_categoria !== existingCategory.nombre_categoria) {
    const categoryWithSameName = await this.prisma.category.findUnique({
      where: { nombre_categoria: updateCategoryDto.nombre_categoria },
    });
    if (categoryWithSameName) {
      throw new ConflictException(`La categoría "${updateCategoryDto.nombre_categoria}" ya existe`);
    }
  }

  // 3. Manejo del icono (prioridades claras)
  let finalIconUrl = existingCategory.icono_url; // Por defecto: mantener el existente

  // Caso 1: Se subió nuevo archivo
  if (iconFile) {
    try {
      const uploadedFile = await this.dmsService.uploadFile(iconFile, null, 'category_icons');
      finalIconUrl = uploadedFile.url;
      
      // Eliminar el icono anterior si existía
      if (existingCategory.icono_url) {
        await this.dmsService.deleteFileByUrl(existingCategory.icono_url);
      }
    } catch (error) {
      console.error('Error al subir icono:', error);
      throw new ConflictException('Error al actualizar el icono');
    }
  } 
  // Caso 2: Se envió explicitamente null/undefined en el DTO
  else if ('icono_url' in updateCategoryDto) {
    finalIconUrl = updateCategoryDto.icono_url ?? null;
    
    // Eliminar el archivo físico si se está removiendo el icono
    if (updateCategoryDto.icono_url === null && existingCategory.icono_url) {
      await this.dmsService.deleteFileByUrl(existingCategory.icono_url);
    }
  }

  // 4. Actualización en base de datos
  return this.prisma.category.update({
    where: { id_categoria },
    data: {
      nombre_categoria: updateCategoryDto.nombre_categoria ?? existingCategory.nombre_categoria,
      descripcion: 'descripcion' in updateCategoryDto 
        ? updateCategoryDto.descripcion 
        : existingCategory.descripcion,
      activo: 'activo' in updateCategoryDto 
        ? updateCategoryDto.activo 
        : existingCategory.activo,
      icono_url: finalIconUrl
    },
    select: {
      id_categoria: true,
      nombre_categoria: true,
      descripcion: true,
      icono_url: true,
      activo: true,
      fecha_creacion: true,
    }
  });
}

  async remove(id_categoria: string): Promise<PrismaCategory> {
    // Opcional: Verificar si la categoría tiene productos asociados antes de eliminar
    // Si hay productos, deberías decidir si quieres eliminar en cascada,
    // o prohibir la eliminación, o reasignar los productos.
    // Por ahora, asumimos que Prisma manejará la cascada si está configurado en el schema,
    // o que se lanzará un error si hay FKs restrictivas.
    const category = await this.prisma.category.delete({
      where: { id_categoria },
    });
    if (!category) { // Aunque .delete() ya lanza NotFoundException si no encuentra.
        throw new NotFoundException(`Categoría con ID "${id_categoria}" no encontrada para eliminar.`);
    }
    return category;
  }

    async findActiveCategories() {
  return this.prisma.category.findMany({
    where: {
      activo: true, // Solo categorías activas
    },
    select: {
      id_categoria: true,
      nombre_categoria: true,
      icono_url: true,
      descripcion: true,
    },
  });
}
}