/**
 * Modal de confirmación para eliminar un libro.
 * Muestra el título del libro y pide confirmación antes de borrar.
 */

import type { Book } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface DeleteConfirmProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DeleteConfirm({
  book,
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteConfirmProps) {
  if (!book) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Eliminar libro">
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          ¿Estás seguro de que deseas eliminar{' '}
          <span className="text-white font-semibold">"{book.title}"</span>?
        </p>
        <p className="text-xs text-slate-400">
          Esta acción no se puede deshacer y el registro se removerá del inventario.
        </p>
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isLoading}>
            Sí, eliminar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
