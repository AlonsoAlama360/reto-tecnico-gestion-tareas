const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/**
 * Formatea una fecha ISO como "7 oct 2026", en la zona horaria del dispositivo.
 * Se formatea a mano para no depender del soporte de Intl del motor de
 * JavaScript, que varía entre plataformas.
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
