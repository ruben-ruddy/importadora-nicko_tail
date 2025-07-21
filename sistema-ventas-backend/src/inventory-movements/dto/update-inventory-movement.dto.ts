// src/inventory-movements/dto/update-inventory-movement.dto.ts
import { PartialType } from '@nestjs/swagger'; // O '@nestjs/mapped-types'
import { CreateInventoryMovementDto } from './create-inventory-movement.dto';

/**
 * DTO para actualizar un movimiento de inventario.
 * Hace todas las propiedades de CreateInventoryMovementDto opcionales.
 */
export class UpdateInventoryMovementDto extends PartialType(CreateInventoryMovementDto) {
  // No necesitas añadir nada aquí explícitamente, PartialType ya las incluye como opcionales.
  // Sin embargo, si quieres añadir validaciones específicas para la actualización
  // que sobrescriban las de CreateDto, las pondrías aquí.
}