import type { CalculatePriceResponse } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface PriceCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculatePriceResponse | null;
  bookTitle?: string;
}

export default function PriceCalculationModal({
  isOpen,
  onClose,
  result,
  bookTitle,
}: PriceCalculationModalProps) {
  if (!result) return null;

  const isFallback = result.is_fallback;
  const formattedDate = new Date(result.calculation_timestamp).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const currencySymbol = 'Bs.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Desglose de cálculo de precio">
      <div className="space-y-4 text-slate-200">
        {/* Encabezado del libro */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-indigo-400">
            Libro seleccionado
          </div>
          <div className="text-base font-semibold text-white mt-1">
            {bookTitle || result.book?.title || `Libro #${result.book_id}`}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>Moneda de destino:</span>
            <span className="font-semibold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded text-[11px]">
              {result.currency}
            </span>
          </div>
        </div>

        {/* Indicador de fuente de tasa */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-slate-400">Proveedor de tasa de cambio:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isFallback
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isFallback ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            {result.rate_provider || (isFallback ? 'Tasa de contingencia' : 'API en tiempo real')}
          </span>
        </div>

        {/* Desglose paso a paso */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl divide-y divide-slate-800/80 text-xs sm:text-sm">
          {/* Paso 1: Costo USD */}
          <div className="flex justify-between items-center p-3.5">
            <div>
              <div className="text-slate-300 font-medium">1. Costo original (USD)</div>
              <div className="text-[11px] text-slate-500">Costo base de importación</div>
            </div>
            <div className="text-white font-mono font-semibold">
              ${result.cost_usd.toFixed(2)} USD
            </div>
          </div>

          {/* Paso 2: Tasa de cambio */}
          <div className="flex justify-between items-center p-3.5">
            <div>
              <div className="text-slate-300 font-medium">2. Tasa de cambio aplicada</div>
              <div className="text-[11px] text-slate-500">
                1 USD = {result.exchange_rate} {result.currency}
              </div>
            </div>
            <div className="text-indigo-300 font-mono font-semibold">
              × {result.exchange_rate.toFixed(4)}
            </div>
          </div>

          {/* Paso 3: Costo Local */}
          <div className="flex justify-between items-center p-3.5 bg-slate-900/40">
            <div>
              <div className="text-slate-200 font-medium">3. Costo en moneda local</div>
              <div className="text-[11px] text-slate-400">cost_usd × exchange_rate</div>
            </div>
            <div className="text-slate-200 font-mono font-semibold">
              {currencySymbol} {result.cost_local.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Paso 4: Margen de Ganancia */}
          <div className="flex justify-between items-center p-3.5">
            <div>
              <div className="text-slate-300 font-medium">4. Margen de ganancia</div>
              <div className="text-[11px] text-slate-500">Margen comercial requerido</div>
            </div>
            <div className="text-emerald-400 font-mono font-semibold">
              +{result.margin_percentage}%
            </div>
          </div>

          {/* Paso 5: Precio de venta final sugerido */}
          <div className="flex justify-between items-center p-4 bg-indigo-950/20 border-t border-indigo-500/20 rounded-b-xl">
            <div>
              <div className="text-white font-semibold text-sm">
                5. Precio de venta sugerido
              </div>
              <div className="text-[11px] text-indigo-300/80">
                Actualizado en el inventario
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                {currencySymbol} {result.selling_price_local.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-[11px] text-slate-500 text-center">
          Cálculo procesado el {formattedDate}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
