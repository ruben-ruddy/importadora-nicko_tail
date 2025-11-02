// src/clients/clients.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { Client as PrismaClient } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

//crear un cliente
async create(createClientDto: CreateClientDto): Promise<PrismaClient> {
  // Verificar si el cliente ya existe por documento de identidad
  if (createClientDto.documento_identidad) {
    const existingClientByDoc = await this.prisma.client.findFirst({
      where: { documento_identidad: createClientDto.documento_identidad },
    });
    if (existingClientByDoc) {
      throw new ConflictException(`Ya existe un cliente con el documento de identidad "${createClientDto.documento_identidad}".`);
    }
  }
  
  // SOLO verificar email si se proporcionó y no está vacío
if (createClientDto.email && createClientDto.email.trim() !== '') {
  // Validar formato de email manualmente
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(createClientDto.email)) {
    throw new BadRequestException('El email debe ser una dirección de correo válida.');
  }
  
  // Validar unicidad
  const existingClientByEmail = await this.prisma.client.findFirst({
    where: { email: createClientDto.email },
  });
  if (existingClientByEmail) {
    throw new ConflictException(`Ya existe un cliente con el email "${createClientDto.email}".`);
  }
}
  // Crear el cliente
  return this.prisma.client.create({
    data: createClientDto,
  });
}
   //obtener todos los clientes con filtros y paginación
  async findAll(query: ClientQueryDto): Promise<{ clients: PrismaClient[]; total: number; page: number; limit: number; totalPages: number }> {
    const { search, active, page = '1', limit = '10' } = query;

    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where: any = {};

    if (search) {
      where.OR = [
        { nombre_completo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
        { documento_identidad: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== undefined) {
      where.activo = String(active).toLowerCase() === 'true';
    }

    const [clients, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { nombre_completo: 'asc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    const totalPages = Math.ceil(total / take);

    return { 
      clients, 
      total, 
      page: parseInt(page, 10), 
      limit: take,
      totalPages 
    };
  }
  //obtener un cliente por id
  async findOne(id_cliente: string): Promise<PrismaClient> {
    const client = await this.prisma.client.findUnique({
      where: { id_cliente },
    });
    if (!client) {
      throw new NotFoundException(`Cliente con ID "${id_cliente}" no encontrado.`);
    }
    return client;
  }
  //actualizar un cliente
  async update(id_cliente: string, updateClientDto: UpdateClientDto): Promise<PrismaClient> {
    // Verificar si el cliente existe
    const existingClientById = await this.prisma.client.findUnique({
      where: { id_cliente },
    });
    if (!existingClientById) {
      throw new NotFoundException(`Cliente con ID "${id_cliente}" no encontrado para actualizar.`);
    }

    // Verificar si el nuevo email o documento de identidad ya existen en otro cliente
  //SOLO verificar email si se proporcionó y no está vacío
  if (updateClientDto.email && updateClientDto.email.trim() !== '') {
    const existingClientByEmail = await this.prisma.client.findFirst({
      where: {
        email: updateClientDto.email,
        id_cliente: { not: id_cliente },
      },
    });
    if (existingClientByEmail) {
      throw new ConflictException(`Ya existe un cliente con el email "${updateClientDto.email}".`);
    }
  }
    if (updateClientDto.documento_identidad) {
        const existingClientByDoc = await this.prisma.client.findFirst({
            where: {
                documento_identidad: updateClientDto.documento_identidad,
                id_cliente: { not: id_cliente },
            },
        });
        if (existingClientByDoc) {
            throw new ConflictException(`Ya existe un cliente con el documento de identidad "${updateClientDto.documento_identidad}".`);
        }
    }

    return this.prisma.client.update({
      where: { id_cliente },
      data: updateClientDto,
    });
  }
//eliminar un cliente
  async remove(id_cliente: string): Promise<PrismaClient> {
    const existingClient = await this.prisma.client.findUnique({
      where: { id_cliente },
    });
    if (!existingClient) {
      throw new NotFoundException(`Cliente con ID "${id_cliente}" no encontrado para eliminar.`);
    }

    // Verificar si tiene ventas asociadas
    const clientSalesCount = await this.prisma.sale.count({ where: { id_cliente } });
    if (clientSalesCount > 0) {
        throw new ConflictException(`No se puede eliminar el cliente con ID "${id_cliente}" porque tiene ventas asociadas.`);
    }

    return this.prisma.client.delete({
      where: { id_cliente },
    });
  }
}