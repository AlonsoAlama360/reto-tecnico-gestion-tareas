import { Text } from 'react-native';
import type { TextProps } from 'react-native';
import { colors, typography } from '../theme';
import type { TypographyVariant } from '../theme';

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/**
 * Único punto de entrada de texto en la app: garantiza que la tipografía
 * salga siempre de los tokens del tema.
 */
export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  style,
  ...rest
}: AppTextProps) {
  return <Text style={[typography[variant], { color }, style]} {...rest} />;
}
