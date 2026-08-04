import { useAppStore } from './store/useAppStore';

export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  amber: string;
  amberLight: string;
  background: string;
  white: string;
  black: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray900: string;
  blue50: string;
  blue100: string;
  blue500: string;
  blue600: string;
  blue700: string;
  green100: string;
  green500: string;
  green600: string;
  green700: string;
  orange100: string;
  orange500: string;
  orange600: string;
  orange700: string;
  purple500: string;
  red50: string;
  red100: string;
  red500: string;
  red600: string;
  red700: string;
}

export const lightColors: ThemeColors = {
  amber: '#FFB800',
  amberLight: '#FFD700',
  background: '#F9FAFB',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray900: '#111827',
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  green100: '#DCFCE7',
  green500: '#22C55E',
  green600: '#16A34A',
  green700: '#15803D',
  orange100: '#FFEDD5',
  orange500: '#F97316',
  orange600: '#EA580C',
  orange700: '#C2410C',
  purple500: '#A855F7',
  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red500: '#EF4444',
  red600: '#DC2626',
  red700: '#B91C1C',
};

export const darkColors: ThemeColors = {
  amber: '#FFB800',
  amberLight: '#FFD700',
  background: '#0B0F14',
  white: '#151A21',
  black: '#F4F6F8',
  gray50: '#0B0F14',
  gray100: '#1A2029',
  gray200: '#262D38',
  gray300: '#37404D',
  gray400: '#8B94A1',
  gray500: '#A6AEBA',
  gray600: '#C6CED8',
  gray700: '#E2E7EE',
  gray900: '#F4F6F8',
  blue50: '#122C44',
  blue100: '#16354F',
  blue500: '#60A5FA',
  blue600: '#93C5FD',
  blue700: '#C7DBFE',
  green100: '#122A1D',
  green500: '#34D399',
  green600: '#6EE7B7',
  green700: '#A7F3D0',
  orange100: '#33200F',
  orange500: '#FB923C',
  orange600: '#FDBA74',
  orange700: '#FED7AA',
  purple500: '#C084FC',
  red50: '#331111',
  red100: '#452020',
  red500: '#F87171',
  red600: '#FCA5A5',
  red700: '#FECACA',
};

export function useTheme(): ThemeColors {
  return useAppStore((state) => (state.theme === 'dark' ? darkColors : lightColors));
}
