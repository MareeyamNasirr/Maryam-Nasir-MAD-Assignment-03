import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';

const palette = {
  light: { background: '#FFFFFF', surface: '#F4F7FF', border: '#E4EAF7' },
  dark: { background: '#141B2D', surface: '#202A40', border: '#34415D' },
};

type Props = ViewProps & { variant?: 'background' | 'surface'; lightColor?: string; darkColor?: string };

export function ThemedView({ style, variant = 'background', lightColor, darkColor, ...rest }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const colors = palette[scheme];
  const backgroundColor = scheme === 'dark' ? (darkColor ?? (variant === 'surface' ? colors.surface : colors.background)) : (lightColor ?? (variant === 'surface' ? colors.surface : colors.background));
  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
