import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type StyleProp, type PressableProps } from 'react-native';
import { useTheme, type ThemeColors } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card = ({ children, style, onPress }: CardProps) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const content = <>{children}</>;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}>
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{content}</View>;
};

interface ButtonProps extends PressableProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

const sizes: Record<NonNullable<ButtonProps['size']>, { py: number; px: number; fontSize: number }> = {
  sm: { py: 6, px: 12, fontSize: 14 },
  md: { py: 10, px: 16, fontSize: 16 },
  lg: { py: 14, px: 24, fontSize: 18 },
};

export const Button = ({ children, variant = 'primary', size = 'md', style, disabled, ...props }: ButtonProps) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const s = sizes[size];

  const variants: Record<NonNullable<ButtonProps['variant']>, { bg: string; fg: string; border?: number; borderColor?: string }> = {
    primary: { bg: colors.amber, fg: colors.black },
    secondary: { bg: colors.white, fg: colors.black, border: 1, borderColor: colors.gray200 },
    outline: { bg: 'transparent', fg: colors.black, border: 2, borderColor: colors.amber },
    ghost: { bg: 'transparent', fg: colors.gray600 },
    danger: { bg: colors.red500, fg: colors.white },
  };

  const v = variants[variant];
  const textStyle = [styles.buttonText, { color: v.fg, fontSize: s.fontSize }];

  const flattenChildren = (nodes: React.ReactNode): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    React.Children.forEach(nodes, (child) => {
      if (Array.isArray(child)) {
        out.push(...flattenChildren(child));
      } else if (React.isValidElement(child) && child.type === React.Fragment) {
        out.push(...flattenChildren((child.props as any).children));
      } else {
        out.push(child);
      }
    });
    return out;
  };

  const renderChildren = () => {
    const flat = flattenChildren(children);
    return flat.map((child, i) =>
      typeof child === 'string' || typeof child === 'number' ? (
        <Text key={i} style={textStyle}>
          {child}
        </Text>
      ) : (
        <React.Fragment key={i}>{child}</React.Fragment>
      )
    );
  };

  return (
    <Pressable
      disabled={disabled}
      {...props}
      style={({ pressed }) =>
        [
          styles.button,
          {
            backgroundColor: v.bg,
            paddingVertical: s.py,
            paddingHorizontal: s.px,
            borderWidth: v.border,
            borderColor: v.borderColor,
            opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
            transform: pressed ? [{ scale: 0.98 }] : [],
          },
          style as any,
        ] as any
      }
    >
      {renderChildren()}
    </Pressable>
  );
};

type BadgeColor = 'green' | 'orange' | 'red' | 'blue' | 'gray';

export const Badge = ({ children, color = 'green' }: { children: React.ReactNode; color?: BadgeColor }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const badgeColors: Record<BadgeColor, { bg: string; fg: string }> = {
    green: { bg: colors.green100, fg: colors.green700 },
    orange: { bg: colors.orange100, fg: colors.orange700 },
    red: { bg: colors.red100, fg: colors.red700 },
    blue: { bg: colors.blue100, fg: colors.blue600 },
    gray: { bg: colors.gray100, fg: colors.gray700 },
  };

  const c = badgeColors[color];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{children}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.gray100,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cardPressed: {
      opacity: 0.85,
    },
    button: {
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    buttonText: {
      fontWeight: '600',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      alignSelf: 'flex-start',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
