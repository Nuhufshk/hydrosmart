import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ArrowLeft, Droplets, Activity, Zap, History, Wifi, Cpu, GraduationCap, CheckCircle2 } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../theme';

const FeatureRow = ({ icon: Icon, label, description, color }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIcon, { backgroundColor: color }]}>
        <Icon size={18} color={colors.white} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureLabel}>{label}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
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

const Paragraph = ({ children }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.paragraph}>{children}</Text>;
};

export const AboutScreen = ({ onBack }: { onBack: () => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logo}>
            <Droplets size={48} color={colors.amber} strokeWidth={2} />
          </View>
          <Text style={styles.appName}>HydroSmart</Text>
          <Text style={styles.tagline}>Smart Nutrient Dosing Controller</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 2.4.0</Text>
          </View>
        </View>

        <Section title="Overview">
          <Paragraph>
            HydroSmart is an IoT-powered automated nutrient dosing controller built for hydroponic farming
            systems. It continuously monitors the water quality in your reservoir and automatically adjusts
            nutrient and pH levels to keep your crops healthy and thriving — with zero daily babysitting.
          </Paragraph>
        </Section>

        <Section title="Key Features">
          <FeatureRow icon={Activity} label="Real-time Monitoring" description="Live pH, EC and temperature telemetry" color={colors.amber} />
          <FeatureRow icon={Zap} label="Automatic Dosing" description="ESP32 manages pH & EC levels hands-free" color={colors.green500} />
          <FeatureRow icon={CheckCircle2} label="Manual Override" description="Full pump, valve and relay control on demand" color={colors.blue500} />
          <FeatureRow icon={History} label="History & Analytics" description="Track sensor trends over 24h, 7d and 30d" color={colors.purple500} />
        </Section>

        <Section title="Hardware & Technology">
          <FeatureRow icon={Cpu} label="ESP32 Microcontroller" description="Dual-core Wi-Fi + BLE control hub" color={colors.orange500} />
          <FeatureRow icon={Wifi} label="Wi-Fi Connectivity" description="Network discovery, pairing & live telemetry" color={colors.blue500} />
          <FeatureRow icon={Activity} label="Precision Sensors" description="pH and EC probes with temperature sensing" color={colors.green500} />
        </Section>

        <Section title="About the Project">
          <Paragraph>
            HydroSmart was developed as part of the Embedded Systems Project at the Kwame Nkrumah University of
            Science and Technology (KNUST). It combines custom embedded firmware on the ESP32 with a mobile
            companion app to deliver affordable, intelligent nutrient control for modern hydroponics.
          </Paragraph>
          <View style={styles.universityRow}>
            <GraduationCap size={20} color={colors.amber} />
            <Text style={styles.universityText}>Kwame Nkrumah University of Science & Technology</Text>
          </View>
        </Section>

        <View style={styles.footer}>
          <Text style={styles.footerMain}>© 2026 HydroSmart Team</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.black,
    },
    content: {
      padding: 24,
      paddingBottom: 48,
      gap: 24,
    },
    hero: {
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 8,
    },
    logo: {
      width: 96,
      height: 96,
      borderRadius: 28,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    appName: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.black,
      letterSpacing: -0.5,
    },
    tagline: {
      color: colors.gray500,
      fontWeight: '500',
      marginTop: 4,
    },
    versionBadge: {
      marginTop: 12,
      backgroundColor: colors.gray100,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
    },
    versionText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.gray600,
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginLeft: 4,
    },
    sectionBody: {
      backgroundColor: colors.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.gray100,
      padding: 16,
      gap: 16,
    },
    paragraph: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.gray600,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      flex: 1,
    },
    featureLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.gray900,
    },
    featureDescription: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 1,
    },
    universityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    universityText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.gray700,
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    footerMain: {
      color: colors.gray400,
      fontSize: 13,
      fontWeight: '600',
    },
  });
