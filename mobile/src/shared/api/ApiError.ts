export type ApiErrorKind =
  /** No hubo respuesta: sin conexión, servidor caído o host inalcanzable. */
  | 'network'
  /** La petición superó el tiempo máximo de espera. */
  | 'timeout'
  /** El servidor respondió con un código de error. */
  | 'http'
  /** La respuesta no tenía el formato esperado. */
  | 'parse';

/**
 * Error único de la capa de red. Clasificar el fallo aquí permite que el
 * resto de la app decida qué mostrar o si reintentar sin conocer los
 * detalles de fetch.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }

  get isNotFound(): boolean {
    return this.kind === 'http' && this.status === 404;
  }

  /** Un reintento solo tiene sentido si el fallo puede ser transitorio. */
  get isRetryable(): boolean {
    if (this.kind === 'network' || this.kind === 'timeout') {
      return true;
    }
    return (
      this.kind === 'http' && this.status !== undefined && this.status >= 500
    );
  }
}
