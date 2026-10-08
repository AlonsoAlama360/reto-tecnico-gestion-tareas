import type { TaskDetail, TaskPage, TaskSummary } from '../model/task';
import type {
  TasksScreenProps,
  TasksStackParamList,
} from '../navigation/types';

export function makeTask(overrides: Partial<TaskSummary> = {}): TaskSummary {
  return {
    id: 1,
    title: 'Renovar el seguro del auto',
    priority: 'High',
    status: 'Pending',
    createdAt: '2026-10-07T18:21:25Z',
    ...overrides,
  };
}

export function makeTaskDetail(
  overrides: Partial<TaskDetail> = {},
): TaskDetail {
  return {
    ...makeTask(),
    description: 'Comparar al menos tres aseguradoras.',
    ...overrides,
  };
}

export function makePage(
  items: TaskSummary[],
  overrides: Partial<TaskPage> = {},
): TaskPage {
  return {
    items,
    page: 1,
    pageSize: 10,
    totalCount: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    hasNextPage: false,
    ...overrides,
  };
}

/**
 * Props de navegación de una pantalla con las acciones espiadas. Las pantallas
 * reciben la navegación por props, así que se prueban sin montar un navegador.
 */
export function makeScreenProps<RouteName extends keyof TasksStackParamList>(
  name: RouteName,
  params: TasksStackParamList[RouteName],
) {
  const navigation = {
    navigate: jest.fn(),
    setParams: jest.fn(),
    popTo: jest.fn(),
    goBack: jest.fn(),
  };

  const props = {
    navigation,
    route: { key: `${name}-test`, name, params },
  } as unknown as TasksScreenProps<RouteName>;

  return { props, navigation };
}
