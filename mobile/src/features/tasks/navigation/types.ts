import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TaskFilters } from '../model/task';

/**
 * Rutas que aporta la feature de tareas. La app las compone en su
 * navegador raíz; la feature no conoce al resto de la navegación.
 *
 * Los filtros activos viven en los parámetros de TaskList: son estado de
 * navegación (qué se está viendo), no hace falta un store global para ellos.
 */
export type TasksStackParamList = {
  TaskList: TaskFilters | undefined;
  TaskFilters: TaskFilters | undefined;
  TaskDetail: { taskId: number };
};

export type TasksScreenProps<RouteName extends keyof TasksStackParamList> =
  NativeStackScreenProps<TasksStackParamList, RouteName>;
