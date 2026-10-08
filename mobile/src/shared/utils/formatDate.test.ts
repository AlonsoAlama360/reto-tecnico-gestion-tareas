import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formatea día, mes abreviado en español y año', () => {
    // Mediodía UTC: la fecha local es la misma en cualquier zona horaria.
    expect(formatDate('2026-10-07T12:00:00Z')).toBe('7 oct 2026');
    expect(formatDate('2026-01-15T12:00:00Z')).toBe('15 ene 2026');
    expect(formatDate('2025-12-31T12:00:00Z')).toBe('31 dic 2025');
  });

  it('devuelve una cadena vacía si la fecha no es válida', () => {
    expect(formatDate('no es una fecha')).toBe('');
    expect(formatDate('')).toBe('');
  });
});
