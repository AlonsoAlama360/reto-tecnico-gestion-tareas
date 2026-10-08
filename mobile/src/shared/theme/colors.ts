/** Par de colores para elementos con fondo tintado, como las etiquetas. */
export type Tone = {
  foreground: string;
  background: string;
};

export const colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfacePressed: '#F0F2F5',
  border: '#E3E6EB',

  textPrimary: '#16191F',
  textSecondary: '#5B6472',
  textMuted: '#7B8494',

  primary: '#2F5BEA',
  primaryPressed: '#2448C2',
  primarySoft: '#E8EEFF',
  onPrimary: '#FFFFFF',

  danger: '#B42318',
} as const;

export const tones = {
  neutral: { foreground: '#475467', background: '#EEF0F3' },
  blue: { foreground: '#175CD3', background: '#DCEBFE' },
  green: { foreground: '#067647', background: '#DCFAE6' },
  teal: { foreground: '#0E7090', background: '#CFF9FE' },
  amber: { foreground: '#B54708', background: '#FEF0C7' },
  red: { foreground: '#B42318', background: '#FEE4E2' },
} as const satisfies Record<string, Tone>;
