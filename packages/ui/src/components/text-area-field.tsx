import { StyleSheet } from 'react-native';
import { TextField, type TextFieldProps } from './text-field';

import { spacing } from '../tokens';

export interface TextAreaFieldProps extends TextFieldProps {
  minHeight?: number;
}

export function TextAreaField({ minHeight = 120, style, ...props }: TextAreaFieldProps) {
  return (
    <TextField
      multiline
      textAlignVertical="top"
      style={[styles.textArea, { minHeight }, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  textArea: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md
  }
});
