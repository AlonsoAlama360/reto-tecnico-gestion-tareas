import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../theme';
import type { Tone } from '../theme';
import { AppText } from './AppText';

type BadgeProps = {
  label: string;
  tone: Tone;
};

export function Badge({ label, tone }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <AppText variant="label" color={tone.foreground}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
