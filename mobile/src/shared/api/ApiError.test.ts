import { ApiError } from './ApiError';
import { getErrorCopy } from './errorMessages';

describe('ApiError', () => {
  it.each([
    ['network', undefined, true],
    ['timeout', undefined, true],
    ['http', 500, true],
    ['http', 503, true],
    ['http', 400, false],
    ['http', 404, false],
    ['parse', undefined, false],
  ] as const)(
    'un error %s con estado %s es reintentable: %s',
    (kind, status, expected) => {
      expect(new ApiError(kind, 'x', status).isRetryable).toBe(expected);
    },
  );

  it('identifica el 404 como no encontrado', () => {
    expect(new ApiError('http', 'x', 404).isNotFound).toBe(true);
    expect(new ApiError('http', 'x', 500).isNotFound).toBe(false);
    expect(new ApiError('network', 'x').isNotFound).toBe(false);
  });
});

describe('getErrorCopy', () => {
  it('distingue la falta de conexión', () => {
    expect(getErrorCopy(new ApiError('network', 'x')).title).toBe(
      'Sin conexión con el servidor',
    );
  });

  it('distingue el tiempo de espera agotado', () => {
    expect(getErrorCopy(new ApiError('timeout', 'x')).title).toBe(
      'El servidor tarda en responder',
    );
  });

  it('distingue el servicio no disponible', () => {
    expect(getErrorCopy(new ApiError('http', 'x', 503)).title).toBe(
      'Servicio no disponible',
    );
  });

  it('usa un mensaje genérico para cualquier otro fallo', () => {
    const generic = 'Algo salió mal';

    expect(getErrorCopy(new ApiError('http', 'x', 500)).title).toBe(generic);
    expect(getErrorCopy(new ApiError('parse', 'x')).title).toBe(generic);
    expect(getErrorCopy(new Error('inesperado')).title).toBe(generic);
    expect(getErrorCopy(null).title).toBe(generic);
  });
});
