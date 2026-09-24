/**
 * Componente Button reutilizable.
 *
 * ──────────────────────────────────────────────────────────
 * PARA LA ENTREVISTA — Componente reutilizable:
 *   Este botón acepta props como 'variant' y 'isLoading'.
 *   En vez de repetir estilos en cada lugar, usamos UN solo
 *   componente que se adapta según las props.
 *   Esto es el patrón "Composition" de React.
 * ──────────────────────────────────────────────────────────
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-950 border border-indigo-400/30 active:scale-[0.98]',
  secondary:
    'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/70 active:scale-[0.98]',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/25 active:scale-[0.98]',
  danger:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 active:scale-[0.98]',
  outline:
    'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700/60',
};

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-3.5 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] focus:ring-indigo-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        cursor-pointer
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
