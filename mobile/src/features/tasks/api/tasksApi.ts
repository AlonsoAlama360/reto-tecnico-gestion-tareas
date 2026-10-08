import { getJson } from '../../../shared/api/httpClient';
import type { TaskDetail, TaskFilters, TaskPage } from '../model/task';

// Con páginas de 10, el listado de prueba (20 tareas) ya ejercita el scroll
// paginado sin pedir más filas de las que caben en un par de pantallas.
export const TASKS_PAGE_SIZE = 10;

export function fetchTasks(
  filters: TaskFilters,
  page: number,
  signal?: AbortSignal,
): Promise<TaskPage> {
  return getJson<TaskPage>('/api/v1/tasks', {
    params: {
      status: filters.status,
      priority: filters.priority,
      page,
      pageSize: TASKS_PAGE_SIZE,
    },
    signal,
  });
}

export function fetchTaskById(
  id: number,
  signal?: AbortSignal,
): Promise<TaskDetail> {
  return getJson<TaskDetail>(`/api/v1/tasks/${id}`, { signal });
}
