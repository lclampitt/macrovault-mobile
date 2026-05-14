import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Colors } from '../constants/Colors';

export function ThemedInput(props: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={Colors.textMuted}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[styles.input, focused && styles.inputFocused, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: Colors.accent,
  },
});
