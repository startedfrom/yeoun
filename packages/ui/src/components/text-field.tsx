import type { TextInputProps } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '../tokens';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextField({ label, error, helperText, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[styles.label, error ? styles.errorText : null]}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          props.editable === false ? styles.inputDisabled : null,
          style
        ]}
        placeholderTextColor={colors.warmGray400}
        accessibilityLabel={label || props.placeholder}
        accessibilityHint={error || helperText}
        // removed accessibilityState invalid as not supported
        {...props}
      />
      {(error || helperText) && (
        <Text
          style={[styles.helperText, error ? styles.errorText : null]}
          accessibilityRole="text"
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    width: '100%'
  },
  label: {
    ...typography.label,
    color: colors.lavender400
  },
  input: {
    ...typography.bodyL,
    minHeight: 48, // Minimum touch target size
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary
  },
  inputError: {
    borderColor: colors.danger
  },
  inputDisabled: {
    backgroundColor: colors.disabledBackground,
    color: colors.disabledText
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs
  },
  errorText: {
    color: colors.danger
  }
});
