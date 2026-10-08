// Los valores coinciden con los nombres que expone la API.
export const TASK_STATUSES = ['Pending', 'InProgress', 'Completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// De mayor a menor: es el orden en que se ofrecen al filtrar.
export const TASK_PRIORITIES = ['High', 'Medium', 'Low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskSummary = {
  id: number;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** Fecha de creación en ISO 8601 (UTC). */
  createdAt: string;
};

export type TaskDetail = TaskSummary & {
  description: string | null;
};

export type TaskPage = {
  items: TaskSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
};

/** Un filtro sin definir significa "sin filtrar por ese criterio". */
export type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
};

export function countActiveFilters(filters: TaskFilters): number {
  return (filters.status ? 1 : 0) + (filters.priority ? 1 : 0);
}
