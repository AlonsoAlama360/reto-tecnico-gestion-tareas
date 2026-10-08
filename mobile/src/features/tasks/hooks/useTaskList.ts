import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { taskKeys } from '../api/taskKeys';
import { fetchTasks } from '../api/tasksApi';
import type { TaskFilters, TaskSummary } from '../model/task';

/**
 * Listado paginado de tareas. Cada combinación de filtros tiene su propia
 * entrada en caché, así que volver a un filtro ya visitado es inmediato.
 */
export function useTaskList(filters: TaskFilters) {
  const query = useInfiniteQuery({
    queryKey: taskKeys.list(filters),
    queryFn: ({ pageParam, signal }) => fetchTasks(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });

  const tasks = useMemo<TaskSummary[]>(
    () => query.data?.pages.flatMap(page => page.items) ?? [],
    [query.data],
  );

  return {
    tasks,
    totalCount: query.data?.pages[0]?.totalCount,
    hasLoaded: query.data !== undefined,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
