import { useQuery } from '@tanstack/react-query';
import { taskKeys } from '../api/taskKeys';
import { fetchTaskById } from '../api/tasksApi';

export function useTaskDetail(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: ({ signal }) => fetchTaskById(id, signal),
  });
}
