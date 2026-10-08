import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/components';
import { colors, minTouchTarget, radius, spacing } from '../../../shared/theme';
import { countActiveFilters } from '../model/task';
import type { TaskFilters } from '../model/task';
import { priorityLabels, statusLabels } from '../model/taskPresentation';

type TaskListToolbarProps = {
  filters: TaskFilters;
  totalCount: number | undefined;
  onOpenFilters: () => void;
  onChangeFilters: (filters: TaskFilters) => void;
};

function formatCount(totalCount: number | undefined): string {
  if (totalCount === undefined) {
    return ' ';
  }
  return totalCount === 1 ? '1 tarea' : `${totalCount} tareas`;
}

function formatFilterButtonLabel(activeCount: number): string {
  if (activeCount === 0) {
    return 'Filtrar';
  }
  return activeCount === 1
    ? 'Filtrar, 1 filtro activo'
    : `Filtrar, ${activeCount} filtros activos`;
}

/** Resumen del listado: total, acceso a los filtros y filtros activos. */
export function TaskListToolbar({
  filters,
  totalCount,
  onOpenFilters,
  onChangeFilters,
}: TaskListToolbarProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText color={colors.textSecondary} testID="task-count">
          {formatCount(totalCount)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={formatFilterButtonLabel(activeCount)}
          onPress={onOpenFilters}
          testID="open-filters"
          style={({ pressed }) => [
            styles.filterButton,
            activeCount > 0 && styles.filterButtonActive,
            pressed && styles.pressed,
          ]}
        >
          <AppText
            variant="bodyStrong"
            color={activeCount > 0 ? colors.primary : colors.textPrimary}
          >
            {activeCount > 0 ? `Filtrar (${activeCount})` : 'Filtrar'}
          </AppText>
        </Pressable>
      </View>

      {activeCount > 0 ? (
        <View style={styles.activeFilters}>
          {filters.status ? (
            <ActiveFilter
              label={statusLabels[filters.status]}
              onRemove={() =>
                onChangeFilters({ ...filters, status: undefined })
              }
            />
          ) : null}
          {filters.priority ? (
            <ActiveFilter
              label={`Prioridad ${priorityLabels[
                filters.priority
              ].toLowerCase()}`}
              onRemove={() =>
                onChangeFilters({ ...filters, priority: undefined })
              }
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ActiveFilter({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Quitar filtro ${label}`}
      onPress={onRemove}
      hitSlop={spacing.sm}
      style={({ pressed }) => [styles.activeFilter, pressed && styles.pressed]}
    >
      <AppText
        variant="caption"
        color={colors.primary}
        style={styles.activeFilterText}
      >
        {label}
      </AppText>
      <AppText
        variant="caption"
        color={colors.primary}
        style={styles.activeFilterText}
      >
        ✕
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterButton: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeFilterText: {
    fontWeight: '600',
  },
});
