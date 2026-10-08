import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../../shared/api/ApiError';
import { getErrorCopy } from '../../../shared/api/errorMessages';
import { AppText, LoadingView, StateView } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { formatDate } from '../../../shared/utils/formatDate';
import { TaskBadges } from '../components/TaskBadges';
import { useTaskDetail } from '../hooks/useTaskDetail';
import type { TasksScreenProps } from '../navigation/types';

export function TaskDetailScreen({
  navigation,
  route,
}: TasksScreenProps<'TaskDetail'>) {
  const insets = useSafeAreaInsets();
  const {
    data: task,
    isPending,
    error,
    refetch,
  } = useTaskDetail(route.params.taskId);

  if (isPending) {
    return (
      <View style={styles.screen}>
        <LoadingView label="Cargando tarea" />
      </View>
    );
  }

  if (!task) {
    // Un 404 no se arregla reintentando: se ofrece volver al listado.
    if (error instanceof ApiError && error.isNotFound) {
      return (
        <View style={styles.screen}>
          <StateView
            title="Tarea no encontrada"
            message="Es posible que esta tarea ya no exista."
            actionLabel="Volver al listado"
            onAction={() => navigation.goBack()}
            testID="task-detail-not-found"
          />
        </View>
      );
    }

    const copy = getErrorCopy(error);
    return (
      <View style={styles.screen}>
        <StateView
          title={copy.title}
          message={copy.message}
          actionLabel="Reintentar"
          onAction={() => refetch()}
          testID="task-detail-error"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
      testID="task-detail"
    >
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {task.title}
        </AppText>
        <TaskBadges status={task.status} priority={task.priority} />
      </View>

      <View style={styles.section}>
        <AppText
          variant="label"
          color={colors.textMuted}
          style={styles.sectionLabel}
        >
          DESCRIPCIÓN
        </AppText>
        {task.description ? (
          <AppText>{task.description}</AppText>
        ) : (
          <AppText color={colors.textMuted}>
            Esta tarea no tiene descripción.
          </AppText>
        )}
      </View>

      <View style={styles.section}>
        <AppText
          variant="label"
          color={colors.textMuted}
          style={styles.sectionLabel}
        >
          FECHA DE CREACIÓN
        </AppText>
        <AppText>{formatDate(task.createdAt)}</AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  section: {
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  sectionLabel: {
    letterSpacing: 0.6,
  },
});
