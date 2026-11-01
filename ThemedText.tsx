import React from 'react';
import { Text, TextProps, useColorScheme } from 'react-native';

type Props = TextProps & { type?: 'default' | 'title' | 'subtitle' | 'muted'; lightColor?: string; darkColor?: string };
export function ThemedText({ style, type = 'default', lightColor, darkColor, ...rest }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const color = scheme === 'dark' ? (darkColor ?? (type === 'muted' ? '#AAB6CF' : '#F5F7FC')) : (lightColor ?? (type === 'muted' ? '#71809F' : '#1D2942'));
  const sizes = { default: 14, title: 27, subtitle: 17, muted: 12 };
  return <Text style={[{ color, fontSize: sizes[type], fontWeight: type === 'title' || type === 'subtitle' ? '700' : '400' }, style]} {...rest} />;
}
