import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { bookService } from '../../services/api';
import type { Book, BookFormData, CalculatePriceResponse } from '../../types';
import BookCard from '../../components/books/BookCard';
import BookForm from '../../components/books/BookForm';
import BookTable from '../../components/books/BookTable';
import DeleteConfirm from '../../components/books/DeleteConfirm';
import PriceCalculationModal from '../../components/books/PriceCalculationModal';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

export default function InventoryPage() {
  // ─── Estado local de la UI ─────────────────────────
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeCategoryQuery, setActiveCategoryQuery] = useState('');
  const [isLowStockOnly, setIsLowStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // Estado del cálculo de precio
  const [calculatingBookId, setCalculatingBookId] = useState<number | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculatePriceResponse | null>(null);
  const [calculatedBookTitle, setCalculatedBookTitle] = useState<string>('');

  const queryClient = useQueryClient();

  // ─── React Query: Obtener libros con filtros ───────
  const {
    data: booksData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['books', page, isLowStockOnly, activeCategoryQuery],
    queryFn: () => {
      if (isLowStockOnly) {
        return bookService.getLowStock(10, page);
      }
      if (activeCategoryQuery) {
        return bookService.searchByCategory(activeCategoryQuery, page);
      }
      return bookService.getAll(page);
    },
  });

  // ─── Mutation: Crear libro ─────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: BookFormData) => bookService.create(data),
    onSuccess: () => {
      toast.success('Libro registrado con éxito');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIsFormOpen(false);
    },
    onError: (err: any) => {
      const detail = err.response?.data;
      if (detail?.isbn) {
        toast.error(`ISBN: ${detail.isbn[0]}`);
      } else if (detail?.cost_usd) {
        toast.error(`Costo: ${detail.cost_usd[0]}`);
      } else {
        toast.error('Error al registrar el libro');
      }
    },
  });

  // ─── Mutation: Actualizar libro ────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BookFormData }) =>
      bookService.update(id, data),
    onSuccess: () => {
      toast.success('Libro actualizado con éxito');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setEditingBook(null);
    },
    onError: (err: any) => {
      const detail = err.response?.data;
      if (detail?.isbn) {
        toast.error(`ISBN: ${detail.isbn[0]}`);
      } else {
        toast.error('Error al actualizar el libro');
      }
    },
  });

  // ─── Mutation: Eliminar libro ──────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookService.delete(id),
    onSuccess: () => {
      toast.success('Libro eliminado del inventario');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setDeletingBook(null);
    },
    onError: () => {
      toast.error('Error al eliminar el libro');
    },
  });

  // ─── Mutation: Calcular precio de un libro ─────────
  const calculateMutation = useMutation({
    mutationFn: ({ book }: { book: Book }) =>
      bookService.calculatePrice(book.id, 'VES'),
    onSuccess: (data, { book }) => {
      setCalculatedBookTitle(book.title);
      setCalculationResult(data);
      toast.success(
        `Precio calculado: Bs. ${data.selling_price_local.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (VES)`,
        { duration: 4000 }
      );
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setCalculatingBookId(null);
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail || 'Error al conectar con la API de divisas';
      toast.error(detail);
      setCalculatingBookId(null);
    },
  });

  // ─── Mutation: Calcular precios de todos los libros ─
  const calculateAllMutation = useMutation({
    mutationFn: () => bookService.calculateAllPrices('VES'),
    onSuccess: (data) => {
      toast.success(
        `Precios actualizados: ${data.message} (tasa: 1 USD = ${data.exchange_rate} VES)`,
        { duration: 5000 }
      );
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: () => {
      toast.error('Error al calcular los precios masivos');
    },
  });

  // ─── Handlers ──────────────────────────────────────
  const handleCreate = (data: BookFormData) => createMutation.mutate(data);

  const handleUpdate = (data: BookFormData) => {
    if (!editingBook) return;
    updateMutation.mutate({ id: editingBook.id, data });
  };

  const handleDelete = () => {
    if (!deletingBook) return;
    deleteMutation.mutate(deletingBook.id);
  };

  const handleCalculatePrice = (book: Book) => {
    setCalculatingBookId(book.id);
    calculateMutation.mutate({ book });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setIsLowStockOnly(false);
    setActiveCategoryQuery(categoryFilter.trim());
  };

  const handleClearFilters = () => {
    setCategoryFilter('');
    setActiveCategoryQuery('');
    setIsLowStockOnly(false);
    setPage(1);
  };

  // ─── Paginación ────────────────────────────────────
  const totalPages = booksData ? Math.ceil(booksData.count / 10) : 0;
  const currentBooks = booksData?.results || [];

  // ─── Métricas calculadas para el dashboard ─────────
  const totalCount = booksData?.count || 0;
  const lowStockCount = currentBooks.filter((b) => b.stock_quantity < 10).length;
  const totalValueUsd = currentBooks.reduce(
    (acc, b) => acc + parseFloat(b.cost_usd || '0') * b.stock_quantity,
    0
  );

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* ─── Barra de Navegación / Header ─── */}
      <header className="border-b border-slate-800/80 bg-[#0D101A]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo y Branding */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                nextep<span className="text-indigo-400">.</span>
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Bookstore Cloud
              </span>
            </div>
            <div className="hidden sm:block h-4 w-[1px] bg-slate-800 mx-1" />
            <p className="hidden md:block text-xs text-slate-400">
              Sistema de gestión y precios en tiempo real
            </p>
          </div>

          {/* Selector de Moneda y Acciones */}
          <div className="flex items-center gap-2.5">
            {/* Indicador de Moneda Activa */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 gap-2 text-xs text-slate-300">
              <span className="text-sm">🇻🇪</span>
              <span className="font-semibold text-white">VES (Bs.)</span>
            </div>

            {/* Botón: Calcular todos */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => calculateAllMutation.mutate()}
              isLoading={calculateAllMutation.isPending}
              className="text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Calcular todos</span>
            </Button>

            {/* Botón: Nuevo libro */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo libro</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Contenedor Principal ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1 relative z-10 space-y-6">
        {/* ─── Sección de Métricas del Inventario ─── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Métrica 1: Total Libros */}
          <div className="bg-[#101420] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total en catálogo</div>
              <div className="text-2xl font-bold text-white mt-0.5 flex items-baseline gap-1.5">
                {totalCount} <span className="text-xs font-normal text-slate-500">libros</span>
              </div>
            </div>
          </div>

          {/* Métrica 2: Bajo Stock */}
          <div className="bg-[#101420] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Bajo inventario (&lt; 10)</div>
              <div className="text-2xl font-bold text-rose-400 mt-0.5 flex items-baseline gap-1.5">
                {lowStockCount} <span className="text-xs font-normal text-slate-500">requieren reposición</span>
              </div>
            </div>
          </div>

          {/* Métrica 3: Inversión Total */}
          <div className="bg-[#101420] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Valor de la página actual</div>
              <div className="text-2xl font-bold text-slate-100 font-mono mt-0.5 flex items-baseline gap-1.5">
                ${totalValueUsd.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-normal text-slate-500 font-sans">USD</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Barra de Filtros, Búsqueda y Alternador de Vistas ─── */}
        <section className="bg-[#101420] border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
          {/* Búsqueda por Categoría */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por categoría (ej: novela, tecnología)..."
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {categoryFilter && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  aria-label="Limpiar filtro"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button variant="secondary" size="sm" type="submit" className="text-xs">
              Filtrar
            </Button>
          </form>

          {/* Filtros Rápidos (Pills) y Switch de Vista */}
          <div className="flex items-center gap-2.5">
            {/* Pill: Todos */}
            <button
              type="button"
              onClick={handleClearFilters}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                !isLowStockOnly && !activeCategoryQuery
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos ({totalCount})
            </button>

            {/* Pill: Bajo Stock */}
            <button
              type="button"
              onClick={() => {
                setIsLowStockOnly(!isLowStockOnly);
                setActiveCategoryQuery('');
                setCategoryFilter('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all border cursor-pointer ${
                isLowStockOnly
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Bajo stock ({lowStockCount})</span>
            </button>

            {/* Alternador de Vista (Grid vs Tabla) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en cuadrícula"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista en tabla"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </section>

        {/* ─── Estado: Cargando ─── */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-slate-400 text-xs">
              Consultando inventario de libros...
            </p>
          </div>
        )}

        {/* ─── Estado: Error ─── */}
        {isError && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center">
            <p className="text-rose-400 text-sm font-semibold">Error al cargar los libros</p>
            <p className="text-slate-400 text-xs mt-1.5">
              {(error as Error)?.message || 'No se pudo comunicar con el servidor backend.'}
            </p>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['books'] })}
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* ─── Estado: Sin resultados ─── */}
        {!isLoading && !isError && currentBooks.length === 0 && (
          <div className="text-center py-16 bg-[#101420] border border-slate-800/80 rounded-2xl px-4">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-white text-base font-semibold">
              {activeCategoryQuery || isLowStockOnly
                ? 'No se encontraron libros con estos filtros'
                : 'El inventario está vacío'}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {activeCategoryQuery || isLowStockOnly
                ? 'Prueba restableciendo los filtros de búsqueda'
                : 'Haz clic en "Nuevo libro" para registrar el primero'}
            </p>
            {(activeCategoryQuery || isLowStockOnly) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4 text-xs"
              >
                Ver todos los libros
              </Button>
            )}
          </div>
        )}

        {/* ─── Listado de Libros (Grid o Tabla) ─── */}
        {!isLoading && !isError && currentBooks.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    currency="VES"
                    onEdit={setEditingBook}
                    onDelete={setDeletingBook}
                    onCalculatePrice={handleCalculatePrice}
                    isCalculating={calculatingBookId === book.id}
                  />
                ))}
              </div>
            ) : (
              <BookTable
                books={currentBooks}
                currency="VES"
                onEdit={setEditingBook}
                onDelete={setDeletingBook}
                onCalculatePrice={handleCalculatePrice}
                calculatingBookId={calculatingBookId}
              />
            )}

            {/* ─── Paginación ─── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!booksData.previous}
                  className="text-xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Anterior</span>
                </Button>
                <span className="text-slate-400 text-xs">
                  Página <span className="font-semibold text-white">{page}</span> de {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!booksData.next}
                  className="text-xs"
                >
                  <span>Siguiente</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Modales ─── */}
      <PriceCalculationModal
        isOpen={!!calculationResult}
        onClose={() => setCalculationResult(null)}
        result={calculationResult}
        bookTitle={calculatedBookTitle}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Registrar nuevo libro"
      >
        <BookForm
          onSubmit={handleCreate}
          onCancel={() => setIsFormOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        title="Editar información del libro"
      >
        <BookForm
          book={editingBook}
          onSubmit={handleUpdate}
          onCancel={() => setEditingBook(null)}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <DeleteConfirm
        book={deletingBook}
        isOpen={!!deletingBook}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
