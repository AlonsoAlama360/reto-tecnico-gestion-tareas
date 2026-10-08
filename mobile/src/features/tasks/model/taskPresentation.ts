import { tones } from '../../../shared/theme';
import type { Tone } from '../../../shared/theme';
import type { TaskPriority, TaskStatus } from './task';

// Record<...> obliga a cubrir todos los valores: si la API añade un estado o
// una prioridad, TypeScript marca aquí lo que falta por definir.

export const statusLabels: Record<TaskStatus, string> = {
  Pending: 'Pendiente',
  InProgress: 'En progreso',
  Completed: 'Completada',
};

export const statusTones: Record<TaskStatus, Tone> = {
  Pending: tones.neutral,
  InProgress: tones.blue,
  Completed: tones.green,
};

export const priorityLabels: Record<TaskPriority, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Baja',
};

export const priorityTones: Record<TaskPriority, Tone> = {
  High: tones.red,
  Medium: tones.amber,
  Low: tones.teal,
};
