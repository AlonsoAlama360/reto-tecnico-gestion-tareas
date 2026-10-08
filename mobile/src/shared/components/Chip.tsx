import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
};

/** Opción seleccionable dentro de un grupo de selección única. */
export function Chip({ label, selected, onPress, testID }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      hitSlop={spacing.xs}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <AppText
        variant="bodyStrong"
        color={selected ? colors.onPrimary : colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
