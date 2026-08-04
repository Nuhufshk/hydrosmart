import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { Wifi, Network, Cable, Zap, Info } from 'lucide-react-native';
import { Card, Button } from '../components/ui';
import { useTheme, type ThemeColors } from '../theme';
import type { DeviceInfo } from '../types';

export const DiscoveryScreen = ({ onConnect }: { onConnect: (device: DeviceInfo) => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [ip, setIp] = useState('192.168.4.1');
  const [port, setPort] = useState('80');
  const [connecting, setConnecting] = useState(false);

  const valid = ip.trim().length > 0 && /^\d+$/.test(port.trim()) && parseInt(port, 10) > 0 && parseInt(port, 10) <= 65535;

  const connect = () => {
    if (!valid || connecting) return;
    setConnecting(true);
    setTimeout(() => {
      onConnect({
        name: 'HydroSmart ESP32',
        ip: ip.trim(),
        port: parseInt(port, 10),
        mac: '48:3F:DA:12:88:C2',
        firmware: 'v1.0.4-stable',
        isPaired: true,
      });
    }, 1200);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Connect to your HydroSmart device</Text>
      </View>

      <Card style={styles.connectCard}>
        <View style={styles.connectTop}>
          <View style={styles.connectIcon}>
            <Wifi size={24} color={colors.black} />
          </View>
          <Text style={styles.connectTitle}>Connect to Device</Text>
          <Text style={styles.connectSubtitle}>
            Enter the IP address and WebSocket port shown on your ESP32's display.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>IP Address</Text>
          <View style={styles.inputWrap}>
            <Network size={18} color={colors.gray400} />
            <TextInput
              value={ip}
              onChangeText={setIp}
              placeholder="e.g. 192.168.4.1"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>WebSocket Port</Text>
          <View style={styles.inputWrap}>
            <Cable size={18} color={colors.gray400} />
            <TextInput
              value={port}
              onChangeText={setPort}
              placeholder="80"
              placeholderTextColor={colors.gray400}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.input}
            />
          </View>
        </View>

        <Button
          variant="primary"
          size="lg"
          style={[styles.connectButton, !valid && styles.connectButtonDisabled]}
          disabled={!valid || connecting}
          onPress={connect}
        >
          {connecting ? <ActivityIndicator size="small" color={colors.black} /> : <Zap size={20} color={colors.black} />}
          {connecting ? 'Connecting...' : 'Connect'}
        </Button>
      </Card>

      <Pressable style={styles.hint}>
        <Info size={16} color={colors.gray400} />
        <Text style={styles.hintText}>The IP address and port are displayed on the device screen after startup.</Text>
      </Pressable>
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
      paddingTop: 16,
      flexGrow: 1,
    },
    header: {
      marginBottom: 24,
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
    connectCard: {
      borderRadius: 24,
      padding: 24,
      gap: 20,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    connectTop: {
      alignItems: 'center',
      gap: 8,
    },
    connectIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.amber,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    connectTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.black,
    },
    connectSubtitle: {
      color: colors.gray500,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
    },
    field: {
      gap: 8,
    },
    label: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.gray500,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginLeft: 4,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      height: 56,
      paddingHorizontal: 16,
      backgroundColor: colors.gray50,
      borderWidth: 2,
      borderColor: colors.gray100,
      borderRadius: 16,
    },
    input: {
      flex: 1,
      fontSize: 17,
      fontWeight: '500',
      color: colors.black,
    },
    connectButton: {
      height: 56,
    },
    connectButtonDisabled: {
      opacity: 0.5,
    },
    hint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 'auto',
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    hintText: {
      flex: 1,
      color: colors.gray400,
      fontSize: 12,
      lineHeight: 16,
    },
  });
