// Esta debe ser la ÚNICA definición de Category para los datos del backend
export interface Category {
  id_categoria: string;
  nombre_categoria: string;
  descripcion?: string | null;
  icono_url?: string | null;
  activo: boolean; 
  fecha_creacion: string; 
}
// Payload para crear una categoría
export interface CreateCategoryPayload {
  nombre_categoria: string;
  descripcion?: string | null;
  activo?: boolean;
}

// Payload para actualizar una categoría
export interface UpdateCategoryPayload {
  nombre_categoria?: string;
  descripcion?: string | null;
  activo?: boolean;
  icono_url?: string | null;
}