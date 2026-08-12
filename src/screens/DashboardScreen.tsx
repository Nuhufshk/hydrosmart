import { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Droplet, Thermometer, Battery, Wifi, Activity, CheckCircle2, AlertTriangle, WifiOff } from 'lucide-react-native';
import { Card, Badge, Button } from '../components/ui';
import { useESP32 } from '../hooks/useESP32';
import { useAppStore } from '../store/useAppStore';
import { useTheme, type ThemeColors } from '../theme';

const StatusCard = ({ title, value, unit, icon: Icon, color }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Card style={styles.statusCard}>
      <View style={[styles.statusIcon, { backgroundColor: color }]}>
        <Icon size={20} color={colors.white} />
      </View>
      <Text style={styles.statusTitle}>{title}</Text>
      <View style={styles.statusValueRow}>
        <Text style={styles.statusValue}>{value}</Text>
        {unit !== '' && <Text style={styles.statusUnit}>{unit}</Text>}
      </View>
    </Card>
  );
};

export const DashboardScreen = () => {
  const { status, loading, error, connected, connect } = useESP32();
  const device = useAppStore((s) => s.device);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handleReconnect = () => {
    if (device) connect(device.ip, device.port ?? 80).catch(() => {});
  };

  if (loading && !status) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.loading}>
        <Animated.View style={[styles.skeletonHero, { opacity: pulse }]} />
        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View key={i} style={[styles.skeletonCard, { opacity: pulse }]} />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (error && !status && connected) {
    return (
      <View style={styles.errorWrap}>
        <AlertTriangle size={48} color={colors.red500} />
        <Text style={styles.errorTitle}>Connection Lost</Text>
        <Text style={styles.errorText}>Could not reach the ESP32 device at {device?.ip ?? '192.168.4.1'}</Text>
        <Button style={styles.errorButton} onPress={handleReconnect}>
          Reconnect
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {connected
              ? status?.mode === 'AUTO'
                ? 'System is running automatically'
                : 'System is in manual mode'
              : 'Device disconnected'}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          {connected ? <Activity size={20} color={colors.amber} /> : <WifiOff size={20} color={colors.gray400} />}
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Badge color={connected ? 'green' : 'red'}>{connected ? 'System Healthy' : 'Disconnected'}</Badge>
          <Text style={styles.heroUptime}>UPTIME: {status?.uptime ?? '—'}</Text>
        </View>
        <View style={styles.heroValues}>
          <View>
            <Text style={styles.heroLabel}>pH Level</Text>
            <Text style={styles.heroNumber}>{status?.ph?.toFixed(1) ?? '—'}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View>
            <Text style={styles.heroLabel}>EC Value</Text>
            <Text style={styles.heroNumber}>{status?.ec?.toFixed(1) ?? '—'}</Text>
          </View>
        </View>
        <Droplet size={140} color="#000000" style={styles.heroWatermark} />
      </View>

      <View style={styles.grid}>
        <StatusCard title="Water Temp" value={status?.temperature != null ? status.temperature.toFixed(1) : '—'} unit="°C" icon={Thermometer} color={colors.orange500} />
        <StatusCard title="Battery" value={status?.battery != null ? String(Math.round(status.battery)) : '—'} unit="%" icon={Battery} color={colors.green500} />
        <StatusCard title="Wi-Fi Signal" value={status?.wifi != null ? String(status.wifi) : '—'} unit="dBm" icon={Wifi} color={colors.blue500} />
        <StatusCard title="Status" value={status?.mode ?? 'OFFLINE'} unit="" icon={CheckCircle2} color={colors.purple500} />
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
      gap: 24,
    },
    loading: {
      padding: 24,
      gap: 24,
    },
    skeletonHero: {
      height: 128,
      backgroundColor: colors.gray100,
      borderRadius: 16,
    },
    skeletonCard: {
      height: 128,
      backgroundColor: colors.gray100,
      borderRadius: 16,
    },
    errorWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.black,
      marginTop: 16,
    },
    errorText: {
      color: colors.gray500,
      textAlign: 'center',
      marginTop: 8,
    },
    errorButton: {
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    headerIcon: {
      backgroundColor: colors.white,
      padding: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.gray100,
    },
    hero: {
      backgroundColor: colors.amber,
      borderRadius: 16,
      padding: 16,
      overflow: 'hidden',
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    heroUptime: {
      fontSize: 11,
      fontWeight: '800',
      opacity: 0.6,
      color: '#000000',
    },
    heroValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 32,
    },
    heroLabel: {
      color: 'rgba(0,0,0,0.6)',
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroNumber: {
      fontSize: 48,
      fontWeight: '900',
      color: '#000000',
      marginTop: 4,
    },
    heroDivider: {
      width: 1,
      height: 64,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    heroWatermark: {
      position: 'absolute',
      right: -20,
      bottom: -20,
      opacity: 0.1,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    statusCard: {
      width: '47%',
      flexGrow: 1,
      borderWidth: 0,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    statusIcon: {
      padding: 8,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 16,
    },
    statusTitle: {
      color: colors.gray500,
      fontSize: 14,
      fontWeight: '500',
    },
    statusValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
      marginTop: 2,
    },
    statusValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.black,
    },
    statusUnit: {
      color: colors.gray400,
      fontSize: 14,
      fontWeight: '500',
    },
  });
