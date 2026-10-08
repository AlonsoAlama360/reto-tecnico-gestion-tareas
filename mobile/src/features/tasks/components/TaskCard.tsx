import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../shared/components';
import { colors, radius, spacing } from '../../../shared/theme';
import { formatDate } from '../../../shared/utils/formatDate';
import type { TaskSummary } from '../model/task';
import { priorityLabels, statusLabels } from '../model/taskPresentation';
import { TaskBadges } from './TaskBadges';

type TaskCardProps = {
  task: TaskSummary;
  onPress: (taskId: number) => void;
};

function TaskCardComponent({ task, onPress }: TaskCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${task.title}. ${
        statusLabels[task.status]
      }. Prioridad ${priorityLabels[task.priority]}.`}
      accessibilityHint="Abre el detalle de la tarea"
      onPress={() => onPress(task.id)}
      testID={`task-card-${task.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <AppText variant="heading" numberOfLines={2}>
        {task.title}
      </AppText>
      <TaskBadges status={task.status} priority={task.priority} />
      <AppText variant="caption" color={colors.textMuted}>
        Creada el {formatDate(task.createdAt)}
      </AppText>
    </Pressable>
  );
}

// memo: al cargar una página nueva, la lista no vuelve a pintar las tarjetas
// que ya estaban en pantalla.
export const TaskCard = memo(TaskCardComponent);

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
