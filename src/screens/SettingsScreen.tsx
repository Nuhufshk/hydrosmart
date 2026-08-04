import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Bell, Moon, Sun, Database, Info, ChevronRight, Shield, Smartphone, LifeBuoy } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme, type ThemeColors } from '../theme';
import { AboutScreen } from './AboutScreen';
import { HelpScreen } from './HelpScreen';

const ToggleSwitch = ({ value, onValueChange }: { value: boolean; onValueChange: (next: boolean) => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [value, anim]);

  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  return (
    <Pressable onPress={() => onValueChange(!value)} style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
      <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: knobX }] }]} />
    </Pressable>
  );
};

const SettingItem = ({ icon: Icon, label, value, iconBg, iconColor, onClick, showChevron = true }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onClick} style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        </View>
      </View>
      {showChevron ? <ChevronRight size={20} color={colors.gray300} /> : null}
    </Pressable>
  );
};

const SettingToggle = ({ icon: Icon, label, value, checked, iconBg, iconColor, onValueChange }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View>
          <Text style={styles.settingLabel}>{label}</Text>
          {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        </View>
      </View>
      <ToggleSwitch value={checked} onValueChange={onValueChange} />
    </View>
  );
};

const Section = ({ title, children }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

export const SettingsScreen = () => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { device, theme, notifications, toggleTheme, toggleNotifications } = useAppStore();
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (showAbout) {
    return <AboutScreen onBack={() => setShowAbout(false)} />;
  }

  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>App & device configuration</Text>
      </View>

      <Section title="Device Info">
        <SettingItem icon={Smartphone} label="Device Name" value={device?.name || 'HydroSmart ESP32'} iconBg={colors.blue100} iconColor={colors.blue600} showChevron={false} />
        <SettingItem icon={Database} label="IP Address" value={device?.ip || '192.168.4.1'} iconBg={colors.gray100} iconColor={colors.gray600} showChevron={false} />
        <SettingItem icon={Shield} label="Firmware Version" value="v1.0.4-stable" iconBg={colors.gray100} iconColor={colors.gray600} showChevron={false} />
      </Section>

      <Section title="Preferences">
        <SettingToggle
          icon={theme === 'light' ? Sun : Moon}
          label="Display Theme"
          value={theme === 'light' ? 'Light' : 'Dark'}
          checked={theme === 'dark'}
          iconBg={colors.gray100}
          iconColor={colors.gray600}
          onValueChange={toggleTheme}
        />
        <SettingToggle
          icon={Bell}
          label="Notifications"
          value="Allow push notifications"
          checked={notifications}
          iconBg={colors.gray100}
          iconColor={colors.gray600}
          onValueChange={toggleNotifications}
        />
      </Section>

      <Section title="System">
        <SettingItem
          icon={Info}
          label="About Us"
          value="Version 2.4.0"
          iconBg={colors.gray100}
          iconColor={colors.gray600}
          onClick={() => setShowAbout(true)}
        />
        <SettingItem
          icon={LifeBuoy}
          label="Help & Support"
          value="FAQ"
          iconBg={colors.blue50}
          iconColor={colors.blue600}
          onClick={() => setShowHelp(true)}
        />
      </Section>

      <View style={styles.footer}>
        <Text style={styles.footerMain}>Developed for KNUST Embedded Systems Project</Text>
        <Text style={styles.footerSub}>© 2026 HydroSmart Team</Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
      paddingBottom: 96,
    },
    header: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.black,
    },
    headerSubtitle: {
      color: colors.gray500,
      fontSize: 13,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginLeft: 16,
      marginBottom: 8,
    },
    sectionBody: {
      backgroundColor: colors.white,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: colors.gray100,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    settingItemPressed: {
      backgroundColor: colors.gray100,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    settingIcon: {
      padding: 8,
      borderRadius: 12,
    },
    settingLabel: {
      fontWeight: '700',
      color: colors.gray900,
      marginBottom: 2,
    },
    settingValue: {
      fontSize: 12,
      color: colors.gray500,
    },
    toggleTrack: {
      width: 56,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gray200,
      padding: 4,
      justifyContent: 'center',
    },
    toggleTrackOn: {
      backgroundColor: colors.amber,
    },
    toggleKnob: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.white,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    footerMain: {
      color: colors.gray400,
      fontSize: 12,
      fontWeight: '500',
    },
    footerSub: {
      color: colors.gray400,
      fontSize: 10,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
