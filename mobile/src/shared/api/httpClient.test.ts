import { API_TIMEOUT_MS } from '../config/env';
import { getJson } from './httpClient';

const fetchMock = jest.fn();

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

/** Simula un servidor que no responde: la petición solo termina si se aborta. */
function neverRespond() {
  fetchMock.mockImplementation(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () =>
          reject(new Error('Aborted')),
        );
      }),
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getJson', () => {
  it('devuelve el cuerpo de una respuesta correcta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }));

    await expect(getJson('/api/v1/tasks/1')).resolves.toEqual({ id: 1 });
  });

  it('añade los parámetros definidos y omite los que no lo están', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await getJson('/api/v1/tasks', {
      params: { status: 'InProgress', priority: undefined, page: 2 },
    });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toMatch(/\/api\/v1\/tasks\?status=InProgress&page=2$/);
  });

  it('no añade el signo de interrogación si no hay parámetros', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await getJson('/api/v1/tasks', { params: { status: undefined } });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/tasks$/);
  });

  it('codifica los valores de los parámetros', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await getJson('/search', { params: { q: 'a b&c' } });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\?q=a%20b%26c$/);
  });

  it.each([400, 404, 500, 503])(
    'convierte una respuesta %s en un error http con su estado',
    async status => {
      fetchMock.mockResolvedValue(jsonResponse({}, status));

      await expect(getJson('/api/v1/tasks')).rejects.toMatchObject({
        name: 'ApiError',
        kind: 'http',
        status,
      });
    },
  );

  it('convierte un fallo de conexión en un error de red', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(getJson('/api/v1/tasks')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'network',
    });
  });

  it('convierte una respuesta que no es JSON en un error de formato', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    });

    await expect(getJson('/api/v1/tasks')).rejects.toMatchObject({
      name: 'ApiError',
      kind: 'parse',
    });
  });

  it('aborta la petición y falla con timeout si el servidor no responde', async () => {
    jest.useFakeTimers();
    neverRespond();

    // Se captura el rechazo antes de avanzar el reloj para que la promesa
    // no quede sin manejar mientras tanto.
    const outcome = getJson('/api/v1/tasks').catch((error: unknown) => error);
    jest.advanceTimersByTime(API_TIMEOUT_MS);

    expect(await outcome).toMatchObject({ name: 'ApiError', kind: 'timeout' });
  });

  it('propaga la cancelación de quien llama sin tratarla como fallo de red', async () => {
    neverRespond();
    const controller = new AbortController();

    const request = getJson('/api/v1/tasks', { signal: controller.signal });
    controller.abort();

    await expect(request).rejects.not.toMatchObject({ name: 'ApiError' });
  });
});
