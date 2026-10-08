import { fireEvent, render, screen } from '@testing-library/react-native';
import type { TaskFilters } from '../model/task';
import { makeScreenProps } from '../test/fixtures';
import { TaskFiltersScreen } from './TaskFiltersScreen';

async function renderScreen(filters?: TaskFilters) {
  const { props, navigation } = makeScreenProps('TaskFilters', filters);
  await render(<TaskFiltersScreen {...props} />);

  return navigation;
}

describe('TaskFiltersScreen', () => {
  it('sin filtros previos, marca "Todos" y "Todas"', async () => {
    await renderScreen();

    expect(screen.getByTestId('filter-status-all')).toBeSelected();
    expect(screen.getByTestId('filter-priority-all')).toBeSelected();
  });

  it('parte de los filtros que ya estaban aplicados', async () => {
    await renderScreen({ status: 'Completed', priority: 'Low' });

    expect(screen.getByTestId('filter-status-Completed')).toBeSelected();
    expect(screen.getByTestId('filter-priority-Low')).toBeSelected();
    expect(screen.getByTestId('filter-status-all')).not.toBeSelected();
  });

  it('al aplicar, vuelve al listado con la selección', async () => {
    const navigation = await renderScreen();

    await fireEvent.press(screen.getByText('En progreso'));
    await fireEvent.press(screen.getByText('Alta'));
    await fireEvent.press(screen.getByText('Aplicar'));

    expect(navigation.popTo).toHaveBeenCalledWith('TaskList', {
      status: 'InProgress',
      priority: 'High',
    });
  });

  it('solo permite un valor por grupo', async () => {
    const navigation = await renderScreen();

    await fireEvent.press(screen.getByText('Pendiente'));
    await fireEvent.press(screen.getByText('Completada'));
    await fireEvent.press(screen.getByText('Aplicar'));

    expect(screen.getByTestId('filter-status-Pending')).not.toBeSelected();
    expect(navigation.popTo).toHaveBeenCalledWith('TaskList', {
      status: 'Completed',
      priority: undefined,
    });
  });

  it('"Todos" quita el filtro de estado sin tocar la prioridad', async () => {
    const navigation = await renderScreen({
      status: 'Pending',
      priority: 'High',
    });

    await fireEvent.press(screen.getByText('Todos'));
    await fireEvent.press(screen.getByText('Aplicar'));

    expect(navigation.popTo).toHaveBeenCalledWith('TaskList', {
      status: undefined,
      priority: 'High',
    });
  });

  it('no cambia el listado hasta que se pulsa "Aplicar"', async () => {
    const navigation = await renderScreen();

    await fireEvent.press(screen.getByText('Pendiente'));

    expect(navigation.popTo).not.toHaveBeenCalled();
  });

  it('"Limpiar" está deshabilitado si no hay nada seleccionado', async () => {
    await renderScreen();

    expect(screen.getByTestId('filters-clear')).toBeDisabled();
  });

  it('"Limpiar" quita toda la selección', async () => {
    const navigation = await renderScreen({
      status: 'Pending',
      priority: 'High',
    });

    await fireEvent.press(screen.getByText('Limpiar'));

    expect(screen.getByTestId('filter-status-all')).toBeSelected();
    expect(screen.getByTestId('filter-priority-all')).toBeSelected();

    await fireEvent.press(screen.getByText('Aplicar'));

    expect(navigation.popTo).toHaveBeenCalledWith('TaskList', {
      status: undefined,
      priority: undefined,
    });
  });
});
