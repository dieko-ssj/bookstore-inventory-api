/**
 * Punto de entrada de la aplicación React.
 *
 * ──────────────────────────────────────────────────────────
 * PARA LA ENTREVISTA — Providers:
 *   React usa el patrón "Provider" para compartir estado/config
 *   entre todos los componentes sin pasar props manualmente.
 *
 *   - QueryClientProvider: Provee React Query a toda la app
 *     (cache, refetch, loading states).
 *   - Toaster: Sistema de notificaciones toast global.
 *
 *   StrictMode: Ayuda a detectar errores comunes en desarrollo
 *   (doble-render para verificar efectos secundarios).
 * ──────────────────────────────────────────────────────────
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Configuración global de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Reintentar 1 vez si falla
      refetchOnWindowFocus: false, // No refrescar al volver a la pestaña
      staleTime: 30_000,           // Datos "frescos" por 30 segundos
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#121522',
            color: '#F8FAFC',
            border: '1px solid #23293D',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            borderRadius: '10px',
            padding: '10px 14px',
            boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.6)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#121522' },
          },
          error: {
            iconTheme: { primary: '#F43F5E', secondary: '#121522' },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
