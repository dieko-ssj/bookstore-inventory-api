import type { Book } from '../../types';
import Button from '../ui/Button';

interface BookTableProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onCalculatePrice: (book: Book) => void;
  calculatingBookId: number | null;
  currency?: string;
}

export default function BookTable({
  books,
  onEdit,
  onDelete,
  onCalculatePrice,
  calculatingBookId,
  currency = 'VES',
}: BookTableProps) {
  const currencySymbol = 'Bs.';

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#101420] shadow-xl">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-medium text-slate-400">
            <th className="py-3.5 px-5">Libro</th>
            <th className="py-3.5 px-5">Código ISBN</th>
            <th className="py-3.5 px-5">Categoría</th>
            <th className="py-3.5 px-5">País</th>
            <th className="py-3.5 px-5 text-center">Inventario</th>
            <th className="py-3.5 px-5 text-right">Costo (USD)</th>
            <th className="py-3.5 px-5 text-right">Precio sugerido (Bs.)</th>
            <th className="py-3.5 px-5 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70 text-slate-300">
          {books.map((book) => {
            const isLowStock = book.stock_quantity < 10;
            const isCalculating = calculatingBookId === book.id;

            return (
              <tr
                key={book.id}
                className="hover:bg-slate-800/30 transition-colors group"
              >
                {/* Título & Autor */}
                <td className="py-3.5 px-5">
                  <div className="font-medium text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {book.title}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{book.author}</div>
                </td>

                {/* ISBN */}
                <td className="py-3.5 px-5 font-mono text-xs text-slate-400">
                  {book.isbn}
                </td>

                {/* Categoría */}
                <td className="py-3.5 px-5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                    {book.category || 'General'}
                  </span>
                </td>

                {/* País */}
                <td className="py-3.5 px-5">
                  <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {book.supplier_country || '—'}
                  </span>
                </td>

                {/* Stock con alerta si es bajo */}
                <td className="py-3.5 px-5 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      isLowStock
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isLowStock ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {book.stock_quantity}
                  </span>
                </td>

                {/* Costo USD */}
                <td className="py-3.5 px-5 text-right font-mono text-slate-300">
                  ${parseFloat(book.cost_usd).toFixed(2)}
                </td>

                {/* Precio Local */}
                <td className="py-3.5 px-5 text-right font-mono font-medium">
                  {book.selling_price_local ? (
                    <span className="text-emerald-400 font-semibold">
                      {currencySymbol} {parseFloat(book.selling_price_local).toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs italic font-sans">Pendiente</span>
                  )}
                </td>

                {/* Botones de acción */}
                <td className="py-3.5 px-5">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCalculatePrice(book)}
                      isLoading={isCalculating}
                      className="text-xs !py-1 !px-2.5 !bg-indigo-600/10 hover:!bg-indigo-600/20 !text-indigo-300 !border-indigo-500/30 whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Calcular</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(book)}
                      className="text-xs !py-1 !px-2.5"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(book)}
                      className="text-xs !py-1 !px-2.5"
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
