// src/categories/categories.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category as PrismaCategory } from '@prisma/client'; // Alias para el tipo Category de Prisma

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<PrismaCategory> {
    // Verificar si ya existe una categoría con el mismo nombre
    const existingCategory = await this.prisma.category.findUnique({
      where: { nombre_categoria: createCategoryDto.nombre_categoria },
    });

    if (existingCategory) {
      throw new ConflictException(`La categoría con nombre "${createCategoryDto.nombre_categoria}" ya existe.`);
    }

    return this.prisma.category.create({
      data: createCategoryDto,
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

  async update(id_categoria: string, updateCategoryDto: UpdateCategoryDto): Promise<PrismaCategory> {
    // Opcional: Verificar si el nuevo nombre de categoría ya existe (si se está actualizando el nombre)
    if (updateCategoryDto.nombre_categoria) {
        const existingCategory = await this.prisma.category.findUnique({
            where: { nombre_categoria: updateCategoryDto.nombre_categoria },
        });
        // Si existe otra categoría con ese nombre y no es la categoría que estamos actualizando
        if (existingCategory && existingCategory.id_categoria !== id_categoria) {
            throw new ConflictException(`La categoría con nombre "${updateCategoryDto.nombre_categoria}" ya existe.`);
        }
    }

    const category = await this.prisma.category.update({
      where: { id_categoria },
      data: updateCategoryDto,
    });
    if (!category) { // Aunque .update() ya lanza NotFoundException si no encuentra, esto es una capa extra.
        throw new NotFoundException(`Categoría con ID "${id_categoria}" no encontrada para actualizar.`);
    }
    return category;
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
}