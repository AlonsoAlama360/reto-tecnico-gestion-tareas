import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

/**
 * Renderiza una pantalla con un cliente de React Query nuevo por test, para
 * que la caché de uno no contamine al siguiente. Se desactivan los
 * reintentos: los tests comprueban qué se muestra ante un fallo, no la
 * política de reintentos, y así no hay esperas.
 */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
