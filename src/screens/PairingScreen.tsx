import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { ArrowLeft, ShieldCheck, Cpu, Info } from 'lucide-react-native';
import { Button, Card } from '../components/ui';
import { useTheme, type ThemeColors } from '../theme';

export const PairingScreen = ({ device, onBack, onPair }: { device: any; onBack: () => void; onPair: () => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef<Array<TextInput | null>>([]);

  const handleChange = (index: number, val: string) => {
    val = val.replace(/\D/g, '').slice(0, 1);
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);
    if (val && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePair = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onPair();
    }, 1500);
  };

  const isComplete = code.every((digit) => digit !== '');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.black} />
        </Pressable>
        <Text style={styles.headerTitle}>Pairing Device</Text>
      </View>

      <View style={styles.body}>
        <Card style={styles.deviceCard}>
          <View style={styles.deviceTop}>
            <View style={styles.deviceIcon}>
              <Cpu size={22} color={colors.black} />
            </View>
            <View>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceIp}>{device.ip}</Text>
            </View>
          </View>

          <View style={styles.deviceDivider} />

          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Firmware</Text>
              <Text style={styles.metaValue}>v1.0.4-stable</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>MAC Address</Text>
              <Text style={styles.metaValue}>48:3F:DA:12:88:C2</Text>
            </View>
          </View>
        </Card>

        <View style={styles.prompt}>
          <View style={styles.infoPill}>
            <Info size={16} color={colors.blue600} />
            <Text style={styles.infoPillText}>Check ESP32 OLED for code</Text>
          </View>
          <Text style={styles.promptTitle}>Enter Pairing Code</Text>
          <Text style={styles.promptSubtitle}>Secure connection code displayed on the device</Text>
        </View>

        <View style={styles.codeRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              value={digit}
              onChangeText={(v) => handleChange(idx, v)}
              maxLength={1}
              keyboardType="number-pad"
              selectTextOnFocus
              style={styles.codeInput}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          style={styles.pairButton}
          disabled={!isComplete || loading}
          onPress={handlePair}
        >
          {loading ? (
            <View style={styles.spinner} />
          ) : (
            <>
              <ShieldCheck size={20} color={colors.black} />
              Confirm & Pair
            </>
          )}
        </Button>
      </View>
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
    body: {
      flex: 1,
      paddingHorizontal: 24,
    },
    deviceCard: {
      marginBottom: 32,
    },
    deviceTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 16,
    },
    deviceIcon: {
      backgroundColor: colors.amber,
      padding: 12,
      borderRadius: 16,
    },
    deviceName: {
      fontWeight: '700',
      fontSize: 17,
      color: colors.black,
    },
    deviceIp: {
      color: colors.gray500,
      fontSize: 13,
    },
    deviceDivider: {
      height: 1,
      backgroundColor: colors.gray100,
      marginBottom: 16,
    },
    metaRow: {
      flexDirection: 'row',
      gap: 16,
    },
    metaLabel: {
      fontSize: 11,
      color: colors.gray400,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metaValue: {
      fontWeight: '500',
      color: colors.black,
      marginTop: 2,
    },
    prompt: {
      alignItems: 'center',
      marginBottom: 40,
    },
    infoPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.blue50,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 16,
    },
    infoPillText: {
      color: colors.blue600,
      fontSize: 14,
      fontWeight: '500',
    },
    promptTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.black,
      marginBottom: 8,
    },
    promptSubtitle: {
      color: colors.gray500,
    },
    codeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    codeInput: {
      width: 48,
      height: 64,
      textAlign: 'center',
      fontSize: 28,
      fontWeight: '800',
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.gray200,
      borderRadius: 12,
      color: colors.black,
    },
    footer: {
      padding: 24,
    },
    pairButton: {
      height: 56,
    },
    spinner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: colors.black,
      borderTopColor: 'transparent',
    },
  });
