import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Chip } from '../../../shared/components';
import { colors, spacing } from '../../../shared/theme';
import { TASK_PRIORITIES, TASK_STATUSES } from '../model/task';
import type { TaskPriority, TaskStatus } from '../model/task';
import { priorityLabels, statusLabels } from '../model/taskPresentation';
import type { TasksScreenProps } from '../navigation/types';

export function TaskFiltersScreen({
  navigation,
  route,
}: TasksScreenProps<'TaskFilters'>) {
  const insets = useSafeAreaInsets();

  // La selección es un borrador local: el listado no cambia hasta pulsar
  // "Aplicar", y salir de la pantalla descarta los cambios.
  const [status, setStatus] = useState<TaskStatus | undefined>(
    route.params?.status,
  );
  const [priority, setPriority] = useState<TaskPriority | undefined>(
    route.params?.priority,
  );

  const clear = () => {
    setStatus(undefined);
    setPriority(undefined);
  };

  const apply = () => navigation.popTo('TaskList', { status, priority });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <FilterGroup
          title="Estado"
          allLabel="Todos"
          options={TASK_STATUSES}
          labels={statusLabels}
          selected={status}
          onSelect={setStatus}
          testIDPrefix="filter-status"
        />
        <FilterGroup
          title="Prioridad"
          allLabel="Todas"
          options={TASK_PRIORITIES}
          labels={priorityLabels}
          selected={priority}
          onSelect={setPriority}
          testIDPrefix="filter-priority"
        />
      </ScrollView>

      <View
        style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <Button
          label="Limpiar"
          variant="secondary"
          onPress={clear}
          disabled={!status && !priority}
          style={styles.action}
          testID="filters-clear"
        />
        <Button
          label="Aplicar"
          onPress={apply}
          style={styles.action}
          testID="filters-apply"
        />
      </View>
    </View>
  );
}

type FilterGroupProps<Option extends string> = {
  title: string;
  allLabel: string;
  options: readonly Option[];
  labels: Record<Option, string>;
  selected: Option | undefined;
  onSelect: (option: Option | undefined) => void;
  testIDPrefix: string;
};

function FilterGroup<Option extends string>({
  title,
  allLabel,
  options,
  labels,
  selected,
  onSelect,
  testIDPrefix,
}: FilterGroupProps<Option>) {
  return (
    <View style={styles.group}>
      <AppText variant="heading">{title}</AppText>
      <View
        style={styles.chips}
        accessibilityRole="radiogroup"
        accessibilityLabel={title}
      >
        <Chip
          label={allLabel}
          selected={selected === undefined}
          onPress={() => onSelect(undefined)}
          testID={`${testIDPrefix}-all`}
        />
        {options.map(option => (
          <Chip
            key={option}
            label={labels[option]}
            selected={selected === option}
            onPress={() => onSelect(option)}
            testID={`${testIDPrefix}-${option}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.xxl,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  group: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
});
