import { fireEvent, screen } from '@testing-library/react-native';
import { ApiError } from '../../../shared/api/ApiError';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { fetchTaskById } from '../api/tasksApi';
import { makeScreenProps, makeTaskDetail } from '../test/fixtures';
import { TaskDetailScreen } from './TaskDetailScreen';

jest.mock('../api/tasksApi');
const fetchTaskByIdMock = jest.mocked(fetchTaskById);

async function renderScreen(taskId = 1) {
  const { props, navigation } = makeScreenProps('TaskDetail', { taskId });
  await renderWithProviders(<TaskDetailScreen {...props} />);

  return navigation;
}

describe('TaskDetailScreen', () => {
  it('pide la tarea indicada en la ruta y muestra su detalle', async () => {
    fetchTaskByIdMock.mockResolvedValue(
      makeTaskDetail({
        id: 7,
        title: 'Pagar el recibo de luz',
        description: 'Vence el día 15.',
        status: 'Completed',
        priority: 'Medium',
        createdAt: '2026-10-06T12:00:00Z',
      }),
    );

    await renderScreen(7);

    expect(await screen.findByText('Pagar el recibo de luz')).toBeOnTheScreen();
    expect(screen.getByText('Vence el día 15.')).toBeOnTheScreen();
    expect(screen.getByText('Completada')).toBeOnTheScreen();
    expect(screen.getByText('Prioridad media')).toBeOnTheScreen();
    expect(screen.getByText('6 oct 2026')).toBeOnTheScreen();
    expect(fetchTaskByIdMock).toHaveBeenCalledWith(7, expect.anything());
  });

  it('muestra el indicador de carga mientras llega la respuesta', async () => {
    fetchTaskByIdMock.mockReturnValue(new Promise(() => {}));

    await renderScreen();

    expect(screen.getByLabelText('Cargando tarea')).toBeOnTheScreen();
  });

  it('indica que no hay descripción cuando la tarea no la tiene', async () => {
    fetchTaskByIdMock.mockResolvedValue(makeTaskDetail({ description: null }));

    await renderScreen();

    expect(
      await screen.findByText('Esta tarea no tiene descripción.'),
    ).toBeOnTheScreen();
  });

  it('ante un 404 ofrece volver al listado en lugar de reintentar', async () => {
    fetchTaskByIdMock.mockRejectedValue(new ApiError('http', 'x', 404));

    const navigation = await renderScreen();

    expect(await screen.findByText('Tarea no encontrada')).toBeOnTheScreen();
    expect(screen.queryByText('Reintentar')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Volver al listado'));

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('ante un fallo de red permite reintentar y carga la tarea', async () => {
    fetchTaskByIdMock.mockRejectedValueOnce(new ApiError('network', 'x'));
    fetchTaskByIdMock.mockResolvedValueOnce(
      makeTaskDetail({ title: 'Renovar el pasaporte' }),
    );

    await renderScreen();

    expect(
      await screen.findByText('Sin conexión con el servidor'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Reintentar'));

    expect(await screen.findByText('Renovar el pasaporte')).toBeOnTheScreen();
    expect(fetchTaskByIdMock).toHaveBeenCalledTimes(2);
  });
});
