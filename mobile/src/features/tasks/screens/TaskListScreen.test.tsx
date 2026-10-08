import { fireEvent, screen } from '@testing-library/react-native';
import { ApiError } from '../../../shared/api/ApiError';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { fetchTasks } from '../api/tasksApi';
import type { TaskFilters } from '../model/task';
import { makePage, makeScreenProps, makeTask } from '../test/fixtures';
import { TaskListScreen } from './TaskListScreen';

jest.mock('../api/tasksApi');
const fetchTasksMock = jest.mocked(fetchTasks);

async function renderScreen(filters?: TaskFilters) {
  const { props, navigation } = makeScreenProps('TaskList', filters);
  await renderWithProviders(<TaskListScreen {...props} />);

  return navigation;
}

const firstTask = makeTask({ id: 1, title: 'Renovar el seguro del auto' });
const secondTask = makeTask({
  id: 2,
  title: 'Pagar el recibo de luz',
  status: 'Completed',
  priority: 'Low',
});

describe('TaskListScreen', () => {
  describe('carga', () => {
    it('muestra el indicador de carga mientras llega la respuesta', async () => {
      fetchTasksMock.mockReturnValue(new Promise(() => {}));

      await renderScreen();

      expect(screen.getByLabelText('Cargando tareas')).toBeOnTheScreen();
    });

    it('muestra las tareas y el total', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask, secondTask]));

      await renderScreen();

      expect(
        await screen.findByText('Renovar el seguro del auto'),
      ).toBeOnTheScreen();
      expect(screen.getByText('Pagar el recibo de luz')).toBeOnTheScreen();
      expect(screen.getByText('2 tareas')).toBeOnTheScreen();
    });

    it('usa el singular cuando hay una sola tarea', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask]));

      await renderScreen();

      expect(await screen.findByText('1 tarea')).toBeOnTheScreen();
    });

    it('pide la primera página con los filtros de la ruta', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask]));

      await renderScreen({ status: 'Pending', priority: 'High' });
      await screen.findByText('Renovar el seguro del auto');

      expect(fetchTasksMock).toHaveBeenCalledWith(
        { status: 'Pending', priority: 'High' },
        1,
        expect.anything(),
      );
    });
  });

  describe('navegación', () => {
    it('abre el detalle al pulsar una tarea', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask, secondTask]));
      const navigation = await renderScreen();

      await fireEvent.press(await screen.findByTestId('task-card-2'));

      expect(navigation.navigate).toHaveBeenCalledWith('TaskDetail', {
        taskId: 2,
      });
    });

    it('abre los filtros con la selección actual', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask]));
      const navigation = await renderScreen({ status: 'Pending' });
      await screen.findByText('Renovar el seguro del auto');

      await fireEvent.press(screen.getByTestId('open-filters'));

      expect(navigation.navigate).toHaveBeenCalledWith('TaskFilters', {
        status: 'Pending',
        priority: undefined,
      });
    });
  });

  describe('filtros activos', () => {
    it('indica cuántos filtros hay aplicados', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask]));

      await renderScreen({ status: 'Pending', priority: 'High' });
      // Se espera a que termine la carga: el botón ya está visible antes y el
      // test acabaría con la petición todavía en curso.
      await screen.findByText('Renovar el seguro del auto');

      expect(screen.getByText('Filtrar (2)')).toBeOnTheScreen();
    });

    it('permite quitar un filtro sin tocar el otro', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask]));
      const navigation = await renderScreen({
        status: 'Pending',
        priority: 'High',
      });
      await screen.findByText('Renovar el seguro del auto');

      await fireEvent.press(screen.getByLabelText('Quitar filtro Pendiente'));

      expect(navigation.setParams).toHaveBeenCalledWith({
        status: undefined,
        priority: 'High',
      });
    });
  });

  describe('sin tareas', () => {
    it('sin filtros, informa de que no hay tareas', async () => {
      fetchTasksMock.mockResolvedValue(makePage([]));

      await renderScreen();

      expect(await screen.findByText('No tienes tareas')).toBeOnTheScreen();
      expect(screen.queryByText('Limpiar filtros')).not.toBeOnTheScreen();
    });

    it('con filtros, informa de que no hay resultados y permite limpiarlos', async () => {
      fetchTasksMock.mockResolvedValue(makePage([]));
      const navigation = await renderScreen({ status: 'Completed' });

      expect(await screen.findByText('Sin resultados')).toBeOnTheScreen();

      await fireEvent.press(screen.getByText('Limpiar filtros'));

      expect(navigation.setParams).toHaveBeenCalledWith({
        status: undefined,
        priority: undefined,
      });
    });
  });

  describe('errores', () => {
    it('ante un fallo inicial permite reintentar y carga las tareas', async () => {
      fetchTasksMock.mockRejectedValueOnce(new ApiError('network', 'x'));
      fetchTasksMock.mockResolvedValueOnce(makePage([firstTask]));

      await renderScreen();

      expect(
        await screen.findByText('Sin conexión con el servidor'),
      ).toBeOnTheScreen();

      await fireEvent.press(screen.getByText('Reintentar'));

      expect(
        await screen.findByText('Renovar el seguro del auto'),
      ).toBeOnTheScreen();
    });

    it('mantiene accesibles los filtros aunque la carga falle', async () => {
      fetchTasksMock.mockRejectedValue(new ApiError('http', 'x', 503));

      await renderScreen({ status: 'Pending' });

      expect(
        await screen.findByText('Servicio no disponible'),
      ).toBeOnTheScreen();
      expect(screen.getByTestId('open-filters')).toBeOnTheScreen();
    });
  });

  describe('paginación', () => {
    const firstPage = makePage([firstTask], {
      totalCount: 2,
      totalPages: 2,
      hasNextPage: true,
    });
    const secondPage = makePage([secondTask], {
      page: 2,
      totalCount: 2,
      totalPages: 2,
    });

    it('carga la página siguiente al llegar al final y la añade al listado', async () => {
      fetchTasksMock.mockResolvedValueOnce(firstPage);
      fetchTasksMock.mockResolvedValueOnce(secondPage);

      await renderScreen();
      await screen.findByText('Renovar el seguro del auto');

      await fireEvent(screen.getByTestId('task-list'), 'endReached');

      expect(
        await screen.findByText('Pagar el recibo de luz'),
      ).toBeOnTheScreen();
      expect(screen.getByText('Renovar el seguro del auto')).toBeOnTheScreen();
      expect(fetchTasksMock).toHaveBeenLastCalledWith({}, 2, expect.anything());
    });

    it('no pide más páginas cuando ya no quedan', async () => {
      fetchTasksMock.mockResolvedValue(makePage([firstTask]));

      await renderScreen();
      await screen.findByText('Renovar el seguro del auto');

      await fireEvent(screen.getByTestId('task-list'), 'endReached');

      expect(fetchTasksMock).toHaveBeenCalledTimes(1);
    });

    it('si falla la página siguiente, conserva las tareas y permite reintentar', async () => {
      fetchTasksMock.mockResolvedValueOnce(firstPage);
      fetchTasksMock.mockRejectedValueOnce(new ApiError('network', 'x'));
      fetchTasksMock.mockResolvedValueOnce(secondPage);

      await renderScreen();
      await screen.findByText('Renovar el seguro del auto');

      await fireEvent(screen.getByTestId('task-list'), 'endReached');

      expect(
        await screen.findByText('No pudimos actualizar el listado.'),
      ).toBeOnTheScreen();
      expect(screen.getByText('Renovar el seguro del auto')).toBeOnTheScreen();

      await fireEvent.press(screen.getByText('Reintentar'));

      expect(
        await screen.findByText('Pagar el recibo de luz'),
      ).toBeOnTheScreen();
    });
  });
});
