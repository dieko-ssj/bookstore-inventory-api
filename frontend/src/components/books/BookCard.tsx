import type { Book } from '../../types';
import Button from '../ui/Button';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onCalculatePrice: (book: Book) => void;
  isCalculating?: boolean;
  currency?: string;
}

export default function BookCard({
  book,
  onEdit,
  onDelete,
  onCalculatePrice,
  isCalculating,
  currency = 'VES',
}: BookCardProps) {
  const isLowStock = book.stock_quantity < 10;
  const currencySymbol = 'Bs.';

  return (
    <div className="group relative bg-[#101420] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-md shadow-black/30 hover:shadow-xl hover:shadow-indigo-950/20 transition-all duration-200 flex flex-col justify-between h-full">
      {/* ─── Encabezado: Categoría, País y Acciones Rápidas ─── */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
            {book.category || 'General'}
          </span>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
              {book.supplier_country || '—'}
            </span>
            <button
              onClick={() => onEdit(book)}
              title="Editar libro"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(book)}
              title="Eliminar libro"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Título y Autor ─── */}
        <div className="mb-4">
          <h3 className="text-slate-100 font-semibold text-base leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
            {book.title}
          </h3>
          <p className="text-slate-400 text-xs mt-1 truncate">
            {book.author}
          </p>
        </div>

        {/* ─── Stock e ISBN ─── */}
        <div className="flex items-center justify-between text-xs mb-3.5 px-0.5">
          <span className="font-mono text-[11px] text-slate-500">
            {book.isbn}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              isLowStock
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
            {book.stock_quantity} en stock
          </span>
        </div>

        {/* ─── Panel de Precios (Costo vs Sugerido) ─── */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 mb-4">
          <div>
            <div className="text-[10px] text-slate-400 font-medium">
              Costo base
            </div>
            <div className="text-sm font-mono font-medium text-slate-200 mt-0.5">
              ${parseFloat(book.cost_usd).toFixed(2)} <span className="text-[10px] text-slate-400">USD</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium">
              Precio sugerido
            </div>
            <div className="text-sm font-mono font-semibold mt-0.5">
              {book.selling_price_local ? (
                <span className="text-emerald-400">
                  {currencySymbol} {parseFloat(book.selling_price_local).toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              ) : (
                <span className="text-slate-500 text-xs italic font-sans">
                  Pendiente
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Botón Principal de Cálculo ─── */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onCalculatePrice(book)}
        isLoading={isCalculating}
        className="w-full text-xs font-medium !bg-indigo-600/10 hover:!bg-indigo-600/20 !text-indigo-300 !border-indigo-500/30 hover:!border-indigo-500/50 shadow-sm"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Calcular precio de venta</span>
      </Button>
    </div>
  );
}
