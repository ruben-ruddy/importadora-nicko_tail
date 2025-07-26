// src/public/dto/public-category.dto.ts
export class PublicCategoryDto {
  id_categoria: string;
  nombre_categoria: string;
  icono_url: string | null; // URL del icono de la categoría, puede ser nulo
  descripcion: string | null; // Descripción de la categoría, puede ser nulo
}
