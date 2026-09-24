/**
 * Tipos TypeScript para la aplicación.
 *
 * ──────────────────────────────────────────────────────────
 * PARA LA ENTREVISTA — ¿Por qué usar TypeScript?
 *   1. Detecta errores ANTES de ejecutar el código (en tiempo de compilación).
 *   2. Autocompletado inteligente en el editor (VS Code).
 *   3. Documenta la forma de los datos (ej: qué campos tiene un Book).
 *   4. Es una buena práctica de la industria para proyectos serios.
 * ──────────────────────────────────────────────────────────
 */

/** Representa un libro como viene del backend (GET response). */
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  cost_usd: string;
  selling_price_local: string | null;
  stock_quantity: number;
  category: string;
  supplier_country: string;
  created_at: string;
  updated_at: string;
}

/** Datos para crear o actualizar un libro (POST/PUT body). */
export interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  cost_usd: number;
  stock_quantity: number;
  category: string;
  supplier_country: string;
}

/** Respuesta paginada del backend (DRF PageNumberPagination). */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Respuesta del endpoint calculate-price (Contrato oficial de Nextep). */
export interface CalculatePriceResponse {
  book_id: number;
  cost_usd: number;
  exchange_rate: number;
  cost_local: number;
  margin_percentage: number;
  selling_price_local: number;
  currency: string;
  calculation_timestamp: string;
  is_fallback?: boolean;
  rate_provider?: string;
  message?: string;
  book?: Book;
}

/** Respuesta del endpoint calculate-all-prices. */
export interface CalculateAllPricesResponse {
  message: string;
  exchange_rate: number;
  currency: string;
  rate_provider?: string;
  is_fallback?: boolean;
}
