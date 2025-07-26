// Esta debe ser la ÚNICA definición de Category para los datos del backend
export interface Category {
  id_categoria: string;
  nombre_categoria: string;
  descripcion?: string | null;
  icono_url?: string | null;
  activo: boolean; // <--- ASEGÚRATE DE QUE ESTA PROPIEDAD ESTÉ AQUÍ
  fecha_creacion: string; // <--- Y QUE ESTA PROPIEDAD ESTÉ AQUÍ (string si viene como ISO, Date si la parseas)
}
// Deja estas si las necesitas, pero el problema es con la primera
export interface CreateCategoryPayload {
  nombre_categoria: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface UpdateCategoryPayload {
  nombre_categoria?: string;
  descripcion?: string | null;
  activo?: boolean;
  icono_url?: string | null;
}