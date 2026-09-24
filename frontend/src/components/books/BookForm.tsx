/**
 * Formulario reutilizable para crear y editar libros.
 *
 * ──────────────────────────────────────────────────────────
 * PARA LA ENTREVISTA — Formulario controlado:
 *   Cada input tiene su valor vinculado al estado de React (useState).
 *   Cuando el usuario escribe, React re-renderiza con el nuevo valor.
 *   Esto nos permite:
 *   - Validar en tiempo real (ej: ISBN solo dígitos)
 *   - Controlar qué puede ingresar el usuario
 *   - Pre-llenar el form al editar un libro existente
 * ──────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import type { Book, BookFormData } from '../../types';
import Button from '../ui/Button';

interface BookFormProps {
  /** Si se pasa un libro, el formulario está en modo "editar". */
  book?: Book | null;
  /** Callback cuando el formulario se envía con datos válidos. */
  onSubmit: (data: BookFormData) => void;
  /** Callback para cerrar/cancelar el formulario. */
  onCancel: () => void;
  /** Indica si la mutación está en progreso (para el loader del botón). */
  isLoading?: boolean;
}

export default function BookForm({ book, onSubmit, onCancel, isLoading }: BookFormProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [costUsd, setCostUsd] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!book;

  // Pre-llenar el formulario cuando se edita un libro
  useEffect(() => {
    if (book) {
      setTitle(book.title);
      setAuthor(book.author);
      setIsbn(book.isbn);
      setCostUsd(book.cost_usd);
      setStock(book.stock_quantity.toString());
      setCategory(book.category);
      setCountry(book.supplier_country);
    }
  }, [book]);

  /** Validación del formulario antes de enviar. */
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'El título es obligatorio';
    if (!author.trim()) newErrors.author = 'El autor es obligatorio';

    // Validación de ISBN: solo dígitos/guiones
    const cleanIsbn = isbn.replace(/-/g, '');
    if (!isbn.trim()) {
      newErrors.isbn = 'El ISBN es obligatorio';
    } else if (!/^\d+$/.test(cleanIsbn)) {
      newErrors.isbn = 'El ISBN debe contener solo dígitos y guiones';
    } else if (cleanIsbn.length !== 10 && cleanIsbn.length !== 13) {
      newErrors.isbn = 'El ISBN debe tener 10 o 13 dígitos';
    }

    // Validación de precio
    const cost = parseFloat(costUsd);
    if (!costUsd.trim()) {
      newErrors.costUsd = 'El costo es obligatorio';
    } else if (isNaN(cost) || cost <= 0) {
      newErrors.costUsd = 'El costo debe ser un número mayor a 0';
    }

    // Validación de stock
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      cost_usd: parseFloat(costUsd),
      stock_quantity: parseInt(stock),
      category: category.trim(),
      supplier_country: country.trim().toUpperCase(),
    });
  };

  /** Estilo base para los inputs. */
  const inputClass = (field: string) => `
    w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm
    bg-slate-950/70 border text-white placeholder-slate-500
    focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/80
    transition-all duration-200
    ${errors[field] ? 'border-rose-500/70 focus:ring-rose-500/30' : 'border-slate-800'}
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Título del libro
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Cien años de soledad"
          className={inputClass('title')}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-rose-400">{errors.title}</p>
        )}
      </div>

      {/* Autor */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Autor
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Ej: Gabriel García Márquez"
          className={inputClass('author')}
        />
        {errors.author && (
          <p className="mt-1 text-xs text-rose-400">{errors.author}</p>
        )}
      </div>

      {/* ISBN */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Código ISBN
        </label>
        <input
          type="text"
          value={isbn}
          onChange={(e) => {
            // Solo permitir dígitos
            const value = e.target.value.replace(/\D/g, '');
            if (value.length <= 13) setIsbn(value);
          }}
          placeholder="Ej: 9780060883287"
          maxLength={13}
          className={`${inputClass('isbn')} font-mono`}
          disabled={isEditing}
        />
        {errors.isbn && (
          <p className="mt-1 text-xs text-rose-400">{errors.isbn}</p>
        )}
        {isEditing && (
          <p className="mt-1 text-xs text-slate-500">
            El código ISBN no se puede modificar al editar
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Costo USD */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Costo base (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={costUsd}
              onChange={(e) => setCostUsd(e.target.value)}
              placeholder="0.00"
              className={`${inputClass('costUsd')} pl-7 font-mono`}
            />
          </div>
          {errors.costUsd && (
            <p className="mt-1 text-xs text-rose-400">{errors.costUsd}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Cantidad en inventario
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={`${inputClass('stock')} font-mono`}
          />
          {errors.stock && (
            <p className="mt-1 text-xs text-rose-400">{errors.stock}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Categoría
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ej: Literatura clásica"
            className={inputClass('category')}
          />
        </div>

        {/* País */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            País proveedor (código ISO 2)
          </label>
          <input
            type="text"
            maxLength={2}
            value={country}
            onChange={(e) => setCountry(e.target.value.toUpperCase())}
            placeholder="Ej: ES"
            className={`${inputClass('country')} font-mono uppercase`}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800/80">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
          {isEditing ? 'Guardar cambios' : 'Registrar libro'}
        </Button>
      </div>
    </form>
  );
}
