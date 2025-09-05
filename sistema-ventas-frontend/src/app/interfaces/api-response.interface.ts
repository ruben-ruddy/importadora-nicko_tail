// interfaces/api-response.interface.ts

// Interface genérica para respuestas paginadas
export interface ApiResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  lastPage?: number;
}

// Interface para respuesta de usuarios
export interface UsersResponse {
  users?: any[];
  data?: any[];
}

// Interface para respuesta de productos
export interface ProductsResponse {
  products?: any[];
  data?: any[];
}

// Interface para respuesta de compras
export interface PurchasesResponse {
  purchases?: any[];
  data?: any[];
}