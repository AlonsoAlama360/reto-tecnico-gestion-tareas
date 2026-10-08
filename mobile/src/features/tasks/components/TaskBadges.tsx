import { StyleSheet, View } from 'react-native';
import { Badge } from '../../../shared/components';
import { spacing } from '../../../shared/theme';
import type { TaskPriority, TaskStatus } from '../model/task';
import {
  priorityLabels,
  priorityTones,
  statusLabels,
  statusTones,
} from '../model/taskPresentation';

type TaskBadgesProps = {
  status: TaskStatus;
  priority: TaskPriority;
};

export function TaskBadges({ status, priority }: TaskBadgesProps) {
  return (
    <View style={styles.row}>
      <Badge label={statusLabels[status]} tone={statusTones[status]} />
      <Badge
        label={`Prioridad ${priorityLabels[priority].toLowerCase()}`}
        tone={priorityTones[priority]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
