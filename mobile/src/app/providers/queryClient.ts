import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../../shared/api/ApiError';

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Durante este tiempo los datos se sirven de caché sin volver a pedirlos:
        // navegar entre el listado y un detalle no dispara peticiones repetidas.
        staleTime: 30_000,
        // Solo se reintenta lo que puede arreglarse solo (red, timeout, 5xx).
        // Reintentar un 400 o un 404 solo retrasa mostrar el error.
        retry: (failureCount, error) =>
          error instanceof ApiError &&
          error.isRetryable &&
          failureCount < MAX_RETRIES,
      },
    },
  });
}
