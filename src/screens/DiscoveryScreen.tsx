import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TextInput, Animated, ScrollView } from 'react-native';
import { Search, Wifi, RefreshCcw, ArrowRight, Cpu } from 'lucide-react-native';
import { Button, Card, Badge } from '../components/ui';
import { useTheme, type ThemeColors } from '../theme';

interface Device {
  id: string;
  name: string;
  ip: string;
  signal: number;
  status: string;
}

export const DiscoveryScreen = ({ onDeviceSelect }: { onDeviceSelect: (device: any) => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scanning, setScanning] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualIP, setManualIP] = useState('192.168.4.1');

  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.5)).current;
  const pulseText = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scan = () => {
    setScanning(true);
    setDevices([]);
    setTimeout(() => {
      setDevices([{ id: '1', name: 'HydroSmart ESP32', ip: '192.168.4.1', signal: -45, status: 'online' }]);
      setScanning(false);
    }, 2000);
  };

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.timing(ringScale, { toValue: 1.8, duration: 2000, useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringOpacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseText, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseText, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      ringScale.stopAnimation();
      ringOpacity.stopAnimation();
      pulseText.stopAnimation();
    }
  }, [scanning, ringScale, ringOpacity, pulseText]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Searching for HydroSmart devices on your network</Text>
        </View>

        {scanning ? (
          <View style={styles.scanning}>
            <View style={styles.scanRingWrap}>
              <Animated.View
                style={[
                  styles.scanRing,
                  { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
              />
              <View style={styles.scanIconWrap}>
                <Search size={32} color={colors.black} />
              </View>
            </View>
            <Animated.Text style={[styles.scanningText, { opacity: pulseText }]}>
              Scanning local Wi-Fi...
            </Animated.Text>
          </View>
        ) : (
          <View style={styles.results}>
            {devices.map((device) => (
              <Card
                key={device.id}
                style={styles.deviceCard}
                onPress={() => onDeviceSelect(device)}
              >
                <View style={styles.deviceRow}>
                  <View style={styles.deviceInfo}>
                    <View style={styles.deviceIcon}>
                      <Cpu size={22} color={colors.gray600} />
                    </View>
                    <View>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <View style={styles.deviceMeta}>
                        <Text style={styles.deviceMetaText}>{device.ip}</Text>
                        <View style={styles.dot} />
                        <View style={styles.signalRow}>
                          <Wifi size={13} color={colors.gray500} />
                          <Text style={styles.deviceMetaText}>{device.signal} dBm</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.deviceReady}>
                    <Badge color="green">Ready</Badge>
                    <ArrowRight size={20} color={colors.gray400} />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          {!scanning && (
            <Button
              variant="primary"
              size="lg"
              style={styles.scanButton}
              onPress={scan}
            >
              <RefreshCcw size={20} color={colors.black} />
              Scan for Devices
            </Button>
          )}
          <Text style={styles.footerText}>Device not showing up?</Text>
          <Button variant="outline" size="lg" style={styles.manualButton} onPress={() => setShowManualModal(true)}>
            Enter IP Address Manually
          </Button>
        </View>
      </ScrollView>

      <Modal visible={showManualModal} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowManualModal(false)} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Connect Manually</Text>
            <Text style={styles.modalSubtitle}>Enter the IP address shown on your ESP32 device.</Text>

            <TextInput
              value={manualIP}
              onChangeText={setManualIP}
              placeholder="e.g. 192.168.4.1"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Button variant="secondary" style={styles.modalAction} onPress={() => setShowManualModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={styles.modalAction}
                onPress={() => {
                  onDeviceSelect({ name: 'HydroSmart ESP32', ip: manualIP, signal: -40, status: 'online' });
                  setShowManualModal(false);
                }}
              >
                Connect
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
      paddingTop: 16,
      flexGrow: 1,
    },
    header: {
      marginBottom: 32,
      marginTop: 16,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.gray900,
    },
    headerSubtitle: {
      color: colors.gray500,
      marginTop: 2,
    },
    scanning: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    scanRingWrap: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanRing: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.amberLight,
    },
    scanIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.amberLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanningText: {
      marginTop: 24,
      color: colors.gray500,
      fontWeight: '500',
    },
    results: {
      gap: 16,
    },
    deviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    deviceRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deviceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    deviceIcon: {
      backgroundColor: colors.gray100,
      padding: 12,
      borderRadius: 12,
    },
    deviceName: {
      fontWeight: '700',
      color: colors.gray900,
    },
    deviceMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    deviceMetaText: {
      color: colors.gray500,
      fontSize: 13,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.gray300,
    },
    signalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    deviceReady: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    scanButton: {
      height: 56,
      minWidth: 220,
    },
    actions: {
      marginTop: 'auto',
      marginBottom: 'auto',
      alignItems: 'center',
      gap: 16,
      paddingTop: 24,
    },
    footerText: {
      textAlign: 'center',
      color: colors.gray400,
      fontSize: 13,
      fontWeight: '500',
    },
    manualButton: {
      height: 56,
      minWidth: 220,
      borderColor: colors.gray200,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.white,
      borderRadius: 40,
      padding: 32,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
      elevation: 12,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.black,
      marginBottom: 8,
    },
    modalSubtitle: {
      color: colors.gray500,
      marginBottom: 24,
    },
    input: {
      width: '100%',
      height: 56,
      paddingHorizontal: 20,
      backgroundColor: colors.gray50,
      borderWidth: 2,
      borderColor: colors.gray100,
      borderRadius: 16,
      fontSize: 17,
      fontWeight: '500',
      marginBottom: 32,
      color: colors.black,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalAction: {
      flex: 1,
    },
  });
