import { ApiError } from './ApiError';

export type ErrorCopy = {
  title: string;
  message: string;
};

/** Traduce un fallo técnico a un texto que la persona pueda entender y resolver. */
export function getErrorCopy(error: unknown): ErrorCopy {
  if (error instanceof ApiError) {
    if (error.kind === 'network') {
      return {
        title: 'Sin conexión con el servidor',
        message: 'Revisa tu conexión a internet e inténtalo de nuevo.',
      };
    }
    if (error.kind === 'timeout') {
      return {
        title: 'El servidor tarda en responder',
        message: 'Inténtalo de nuevo en unos segundos.',
      };
    }
    if (error.kind === 'http' && error.status === 503) {
      return {
        title: 'Servicio no disponible',
        message:
          'Estamos teniendo problemas. Inténtalo de nuevo en unos minutos.',
      };
    }
  }

  return {
    title: 'Algo salió mal',
    message: 'No pudimos cargar la información. Inténtalo de nuevo.',
  };
}
