import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { ArrowLeft, LifeBuoy, Mail, ChevronDown, MessageCircle } from 'lucide-react-native';
import { useTheme, type ThemeColors } from '../theme';

const faqs = [
  {
    question: 'How do I pair HydroSmart with my phone?',
    answer:
      'Open the app, tap "Discover Device" and wait for the scan to find your HydroSmart ESP32. Select it from the list and enter the 6-digit code shown on the device display to complete pairing.',
  },
  {
    question: 'My device is not showing up in discovery. What should I do?',
    answer:
      'Make sure your phone and the HydroSmart device are on the same Wi-Fi network and that the device is powered on. If it still does not appear, you can enter its IP address manually.',
  },
  {
    question: 'How do I reset my HydroSmart device?',
    answer:
      'Press and hold the reset button on the ESP32 for 5 seconds. The device will restart, clear its Wi-Fi credentials and re-enter pairing mode.',
  },
  {
    question: 'Why are my pH or EC readings unusual?',
    answer:
      'The sensors may need calibration. Rinse the probes with distilled water and recalibrate using the supplied buffer solutions. Avoid touching the sensor tips with your hands.',
  },
  {
    question: 'Can HydroSmart work without an internet connection?',
    answer:
      'Yes. HydroSmart connects over your local Wi-Fi network, so live monitoring and dosing continue as normal even if the internet goes down.',
  },
  {
    question: 'How do I update the device firmware?',
    answer:
      'Firmware updates are delivered through the app. Keep the device connected and check the Firmware Version in Settings for available updates.',
  },
];

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.faqItem}>
      <Pressable onPress={() => setOpen(!open)} style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <ChevronDown
          size={20}
          color={colors.gray400}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? <Text style={styles.faqAnswer}>{answer}</Text> : null}
    </View>
  );
};

export const HelpScreen = ({ onBack }: { onBack: () => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const emailSupport = () => {
    Linking.openURL('mailto:support@hydrosmart.app').catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LifeBuoy size={40} color={colors.amber} strokeWidth={2.2} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>Find quick answers or reach our support team</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.sectionBody}>
            {faqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Pressable onPress={emailSupport} style={({ pressed }) => [styles.supportCard, pressed && styles.supportCardPressed]}>
            <View style={styles.supportIcon}>
              <Mail size={22} color={colors.amber} />
            </View>
            <View style={styles.supportText}>
              <Text style={styles.supportLabel}>Email Support</Text>
              <Text style={styles.supportValue}>support@hydrosmart.app</Text>
              <Text style={styles.supportHint}>We typically reply within 24 hours</Text>
            </View>
            <MessageCircle size={20} color={colors.gray300} />
          </Pressable>
        </View>

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
    heroIcon: {
      width: 88,
      height: 88,
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
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.black,
    },
    heroSubtitle: {
      color: colors.gray500,
      fontWeight: '500',
      marginTop: 4,
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
      overflow: 'hidden',
    },
    faqItem: {
      paddingHorizontal: 16,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 16,
    },
    faqQuestion: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.gray900,
    },
    faqAnswer: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.gray600,
      paddingBottom: 16,
    },
    supportCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: colors.white,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.gray100,
      padding: 16,
    },
    supportCardPressed: {
      backgroundColor: colors.gray100,
    },
    supportIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.amber,
      alignItems: 'center',
      justifyContent: 'center',
    },
    supportText: {
      flex: 1,
    },
    supportLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.gray900,
    },
    supportValue: {
      fontSize: 13,
      color: colors.amber,
      fontWeight: '600',
      marginTop: 1,
    },
    supportHint: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 1,
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
