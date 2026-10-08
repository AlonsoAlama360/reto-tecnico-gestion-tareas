import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorCopy } from '../../../shared/api/errorMessages';
import {
  AppText,
  Button,
  LoadingView,
  StateView,
} from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { TaskCard } from '../components/TaskCard';
import { TaskListToolbar } from '../components/TaskListToolbar';
import { useTaskList } from '../hooks/useTaskList';
import { countActiveFilters } from '../model/task';
import type { TaskFilters, TaskSummary } from '../model/task';
import type { TasksScreenProps } from '../navigation/types';

const keyExtractor = (task: TaskSummary) => String(task.id);

export function TaskListScreen({
  navigation,
  route,
}: TasksScreenProps<'TaskList'>) {
  const insets = useSafeAreaInsets();

  const status = route.params?.status;
  const priority = route.params?.priority;
  const filters = useMemo<TaskFilters>(
    () => ({ status, priority }),
    [status, priority],
  );
  const hasActiveFilters = countActiveFilters(filters) > 0;

  const {
    tasks,
    totalCount,
    hasLoaded,
    isPending,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTaskList(filters);

  // El indicador de "tirar para actualizar" solo debe verse cuando la persona
  // lo pidió, no en cada recarga en segundo plano.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    // Si la última carga falló no se reintenta sola al hacer scroll: se
    // ofrece el botón del pie para no encadenar peticiones fallidas.
    if (hasNextPage && !isFetchingNextPage && !error) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, error, fetchNextPage]);

  const setFilters = useCallback(
    (next: TaskFilters) => navigation.setParams(next),
    [navigation],
  );

  const openTask = useCallback(
    (taskId: number) => navigation.navigate('TaskDetail', { taskId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: TaskSummary }) => (
      <TaskCard task={item} onPress={openTask} />
    ),
    [openTask],
  );

  const toolbar = (
    <TaskListToolbar
      filters={filters}
      totalCount={totalCount}
      onOpenFilters={() => navigation.navigate('TaskFilters', filters)}
      onChangeFilters={setFilters}
    />
  );

  if (isPending) {
    return (
      <View style={styles.screen}>
        {toolbar}
        <LoadingView label="Cargando tareas" />
      </View>
    );
  }

  // Error sin nada que mostrar: ocupa la pantalla. Si ya hay tareas en
  // pantalla se conservan y el fallo se informa en el pie de la lista.
  if (error && !hasLoaded) {
    const copy = getErrorCopy(error);
    return (
      <View style={styles.screen}>
        {toolbar}
        <StateView
          title={copy.title}
          message={copy.message}
          actionLabel="Reintentar"
          onAction={() => refetch()}
          testID="task-list-error"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {toolbar}
      <FlatList
        data={tasks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        ItemSeparatorComponent={Separator}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          hasActiveFilters ? (
            <StateView
              title="Sin resultados"
              message="Ninguna tarea coincide con los filtros seleccionados."
              actionLabel="Limpiar filtros"
              onAction={() =>
                setFilters({ status: undefined, priority: undefined })
              }
              testID="task-list-no-results"
            />
          ) : (
            <StateView
              title="No tienes tareas"
              message="Cuando haya tareas, aparecerán aquí."
              testID="task-list-empty"
            />
          )
        }
        ListFooterComponent={
          <ListFooter
            isLoadingMore={isFetchingNextPage}
            hasError={Boolean(error) && tasks.length > 0}
            onRetry={() => (hasNextPage ? fetchNextPage() : refetch())}
          />
        }
        testID="task-list"
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

type ListFooterProps = {
  isLoadingMore: boolean;
  hasError: boolean;
  onRetry: () => void;
};

function ListFooter({ isLoadingMore, hasError, onRetry }: ListFooterProps) {
  if (isLoadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.footer} testID="task-list-footer-error">
        <AppText color={colors.textSecondary} style={styles.footerText}>
          No pudimos actualizar el listado.
        </AppText>
        <Button label="Reintentar" variant="secondary" onPress={onRetry} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  separator: {
    height: spacing.md,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  footerText: {
    textAlign: 'center',
  },
});
