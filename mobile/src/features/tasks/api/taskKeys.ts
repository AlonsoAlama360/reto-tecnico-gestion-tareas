import type { TaskFilters } from '../model/task';

/**
 * Claves de caché de React Query para las tareas. Centralizarlas evita
 * claves escritas a mano que no coinciden y permite invalidar por niveles.
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) =>
    [
      ...taskKeys.lists(),
      filters.status ?? null,
      filters.priority ?? null,
    ] as const,
  detail: (id: number) => [...taskKeys.all, 'detail', id] as const,
};
