import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

type StateViewProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

/** Pantalla completa para los estados sin contenido: vacío, error o no encontrado. */
export function StateView({
  title,
  message,
  actionLabel,
  onAction,
  testID,
}: StateViewProps) {
  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="heading" style={styles.centered}>
        {title}
      </AppText>
      {message ? (
        <AppText color={colors.textSecondary} style={styles.centered}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export function LoadingView({ label }: { label: string }) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      testID="loading-view"
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
  },
});
