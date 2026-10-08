import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';
import { ApiError } from './ApiError';

type QueryParams = Record<string, string | number | undefined>;

type GetOptions = {
  params?: QueryParams;
  /** Señal externa de cancelación, por ejemplo la de React Query al desmontar. */
  signal?: AbortSignal;
};

function buildUrl(path: string, params?: QueryParams): string {
  const query = Object.entries(params ?? {})
    .filter(
      (entry): entry is [string, string | number] => entry[1] !== undefined,
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&');

  return `${API_BASE_URL}${path}${query ? `?${query}` : ''}`;
}

export async function getJson<T>(
  path: string,
  options: GetOptions = {},
): Promise<T> {
  const { params, signal } = options;

  // fetch no tiene tiempo máximo propio: sin esto, una petición a un servidor
  // que no responde dejaría la pantalla cargando indefinidamente.
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, API_TIMEOUT_MS);

  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  try {
    let response: Response;
    try {
      response = await fetch(buildUrl(path, params), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new ApiError('timeout', 'The request timed out.');
      }
      if (signal?.aborted) {
        // Cancelación pedida por quien llama: se propaga tal cual para que
        // no se trate como un fallo de red.
        throw error;
      }
      throw new ApiError('network', 'The server could not be reached.');
    }

    if (!response.ok) {
      throw new ApiError(
        'http',
        `Request failed with status ${response.status}.`,
        response.status,
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError('parse', 'The response is not valid JSON.');
    }
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}
