/**
 * Servicio API — Capa de abstracción para las llamadas HTTP al backend.
 *
 * ──────────────────────────────────────────────────────────
 * PARA LA ENTREVISTA — ¿Por qué separar el servicio?
 *   Principio de Separación de Responsabilidades:
 *   - Los componentes React solo se encargan de la UI.
 *   - Este archivo se encarga de CÓMO comunicarse con el backend.
 *   - Si mañana cambia la URL base o el formato, solo cambias ESTE archivo.
 * ──────────────────────────────────────────────────────────
 */

import axios from 'axios';
import type {
  Book,
  BookFormData,
  CalculateAllPricesResponse,
  CalculatePriceResponse,
  PaginatedResponse,
} from '../types';

// Instancia de Axios preconfigurada
const api = axios.create({
  baseURL: '/api',  // El proxy de Vite redirige esto a http://localhost:8000/api
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Servicio de libros — Todas las operaciones CRUD + cálculo de precio. */
export const bookService = {
  /**
   * Lista todos los libros (paginados).
   * GET /api/books/?page=X
   */
  getAll: async (page = 1): Promise<PaginatedResponse<Book>> => {
    const { data } = await api.get<PaginatedResponse<Book>>(`/books/?page=${page}`);
    return data;
  },

  /**
   * Obtiene un libro por su ID.
   * GET /api/books/{id}/
   */
  getById: async (id: number): Promise<Book> => {
    const { data } = await api.get<Book>(`/books/${id}/`);
    return data;
  },

  /**
   * Crea un nuevo libro.
   * POST /api/books/
   */
  create: async (book: BookFormData): Promise<Book> => {
    const { data } = await api.post<Book>('/books/', book);
    return data;
  },

  /**
   * Actualiza un libro existente.
   * PUT /api/books/{id}/
   */
  update: async (id: number, book: BookFormData): Promise<Book> => {
    const { data } = await api.put<Book>(`/books/${id}/`, book);
    return data;
  },

  /**
   * Elimina un libro.
   * DELETE /api/books/{id}/
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}/`);
  },

  /**
   * Busca libros por categoría.
   * GET /api/books/search/?category=...&page=X
   */
  searchByCategory: async (category: string, page = 1): Promise<PaginatedResponse<Book>> => {
    const { data } = await api.get<PaginatedResponse<Book>>(
      `/books/search/?category=${encodeURIComponent(category)}&page=${page}`
    );
    return data;
  },

  /**
   * Filtra libros con stock bajo.
   * GET /api/books/low-stock/?threshold=...&page=X
   */
  getLowStock: async (threshold = 10, page = 1): Promise<PaginatedResponse<Book>> => {
    const { data } = await api.get<PaginatedResponse<Book>>(
      `/books/low-stock/?threshold=${threshold}&page=${page}`
    );
    return data;
  },

  /**
   * Calcula el precio en moneda local para un libro específico.
   * POST /api/books/{id}/calculate-price/
   */
  calculatePrice: async (id: number, currency?: string): Promise<CalculatePriceResponse> => {
    const { data } = await api.post<CalculatePriceResponse>(
      `/books/${id}/calculate-price/`,
      currency ? { currency } : {}
    );
    return data;
  },

  /**
   * Calcula el precio para TODOS los libros.
   * POST /api/books/calculate-all-prices/
   */
  calculateAllPrices: async (currency?: string): Promise<CalculateAllPricesResponse> => {
    const { data } = await api.post<CalculateAllPricesResponse>(
      '/books/calculate-all-prices/',
      currency ? { currency } : {}
    );
    return data;
  },
};
