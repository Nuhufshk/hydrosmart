import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, Alert, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LayoutDashboard, Activity, Zap, Settings as SettingsIcon, Wifi, WifiOff } from 'lucide-react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card, Button } from './components/ui';

import { SplashScreen } from './screens/SplashScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ControlScreen } from './screens/ControlScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useAppStore } from './store/useAppStore';
import { useESP32 } from './hooks/useESP32';
import { useTheme, type ThemeColors } from './theme';
import type { DeviceInfo } from './types';

type Tab = 'dashboard' | 'monitoring' | 'control' | 'settings';

const BottomTab = ({ icon: Icon, label, active, onPress }: { icon: any; label: string; active: boolean; onPress: () => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <View style={styles.tabIcon}>
        <Icon size={20} color={active ? colors.amber : colors.gray400} />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
};

const FadeSlide = ({ children }: { children: React.ReactNode }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [opacity]);

  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
};

const Gauge = ({ value, max }: { value: number; max: number }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const r = 88;
  const c = 2 * Math.PI * r;
  const progress = Math.min(value / max, 1);
  return (
    <View style={styles.gauge}>
      <Svg width={192} height={192} viewBox="0 0 192 192">
        <Circle cx={96} cy={96} r={r} stroke={colors.gray100} strokeWidth={12} fill="transparent" />
        <Circle
          cx={96}
          cy={96}
          r={r}
          stroke={colors.amberLight}
          strokeWidth={12}
          fill="transparent"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          rotation={-90}
          originX={96}
          originY={96}
        />
      </Svg>
      <View style={styles.gaugeCenter}>
        <Text style={styles.gaugeValue}>{value}</Text>
        <Text style={styles.gaugeLabel}>pH Level</Text>
      </View>
    </View>
  );
};

const ConnectionCard = ({ connected, deviceName, onDisconnect, onConnect }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Card style={[styles.connectionCard, connected ? styles.connectionCardOn : styles.connectionCardOff]}>
      <View style={styles.connectionInfo}>
        <View style={[styles.connectionIcon, connected ? styles.connectionIconOn : styles.connectionIconOff]}>
          {connected ? <Wifi size={24} color={colors.green600} /> : <WifiOff size={24} color={colors.gray500} />}
        </View>
        <View style={styles.connectionText}>
          <Text style={styles.connectionTitle}>{connected ? 'Connected' : 'Disconnected'}</Text>
          <Text style={styles.connectionSubtitle}>
            {connected ? deviceName : 'Tap below to reconnect to your device'}
          </Text>
        </View>
      </View>
      <Button
        variant={connected ? 'danger' : 'primary'}
        style={styles.connectionButton}
        onPress={connected ? onDisconnect : onConnect}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </Button>
    </Card>
  );
};

const MonitoringScreen = ({ onOpenDiscovery }: { onOpenDiscovery?: () => void }) => {
  const { status, connected, connect, disconnect } = useESP32();
  const device = useAppStore((s) => s.device);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const confirmDisconnect = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Disconnect Device\n\nThis will stop live telemetry. You can reconnect anytime.')) {
        disconnect();
      }
      return;
    }
    Alert.alert('Disconnect Device', 'This will stop live telemetry. You can reconnect anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: disconnect },
    ]);
  };

  const handleReconnect = async () => {
    if (device) {
      try {
        await connect(device.ip, device.port ?? 80);
      } catch {
        if (onOpenDiscovery) onOpenDiscovery();
      }
    } else if (onOpenDiscovery) {
      onOpenDiscovery();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.monitoring}>
      <View style={styles.monitoringHeader}>
        <Text style={styles.monitoringTitle}>Live Monitoring</Text>
        <Text style={styles.monitoringSubtitle}>Real-time sensor telemetry</Text>
      </View>

      <Card style={styles.gaugeCard}>
        <Gauge value={status?.ph != null ? Number(status.ph.toFixed(2)) : 6.4} max={14} />
      </Card>

      <View style={styles.monitoringGrid}>
        <Card style={styles.monitoringCard}>
          <Text style={styles.monitoringValue}>{status?.ec?.toFixed(2) ?? '1.80'}</Text>
          <Text style={styles.monitoringLabel}>EC (mS/cm)</Text>
        </Card>
        <Card style={styles.monitoringCard}>
          <Text style={styles.monitoringValue}>
            {status?.temperature != null ? `${status.temperature.toFixed(1)}°C` : '25.3°C'}
          </Text>
          <Text style={styles.monitoringLabel}>Temperature</Text>
        </Card>
      </View>

      <ConnectionCard
        connected={connected}
        deviceName={device?.name || 'HydroSmart ESP32'}
        onDisconnect={confirmDisconnect}
        onConnect={handleReconnect}
      />
    </ScrollView>
  );
};

function AppContent() {
  const insets = useSafeAreaInsets();
  const theme = useAppStore((state) => state.theme);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const { isPaired, connected, setPaired, setDevice, setConnected } = useAppStore();
  const [currentScreen, setCurrentScreen] = useState<'discovery' | 'main'>('main');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (isPaired && connected) {
      setCurrentScreen('main');
      setActiveTab('dashboard');
    }
  }, [isPaired, connected]);

  const handleConnect = (device: DeviceInfo) => {
    setDevice(device);
    setPaired(true);
    setConnected(true);
    setCurrentScreen('main');
    setActiveTab('dashboard');
  };

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <View style={[styles.app, { paddingTop: insets.top }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.shell, Platform.OS === 'web' && styles.shellWeb]}>
        {currentScreen === 'discovery' && (
          <FadeSlide>
            <DiscoveryScreen onConnect={handleConnect} onBack={() => setCurrentScreen('main')} />
          </FadeSlide>
        )}

        {currentScreen === 'main' && (
          <FadeSlide>
            <View style={styles.main}>
              <View style={styles.mainContent}>
                {activeTab === 'dashboard' && <DashboardScreen />}
                {activeTab === 'monitoring' && <MonitoringScreen onOpenDiscovery={() => setCurrentScreen('discovery')} />}
                {activeTab === 'control' && <ControlScreen />}
                {activeTab === 'settings' && <SettingsScreen />}
              </View>

              <View style={[styles.nav, { paddingBottom: insets.bottom + 12 }]}>
                <BottomTab icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} onPress={() => setActiveTab('dashboard')} />
                <BottomTab icon={Activity} label="Connect" active={activeTab === 'monitoring'} onPress={() => setActiveTab('monitoring')} />
                <BottomTab icon={Zap} label="Control" active={activeTab === 'control'} onPress={() => setActiveTab('control')} />
                <BottomTab icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
              </View>
            </View>
          </FadeSlide>
        )}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    app: {
      flex: 1,
      backgroundColor: colors.background,
    },
    shell: {
      flex: 1,
    },
    shellWeb: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
    },
    main: {
      flex: 1,
    },
    mainContent: {
      flex: 1,
    },
    nav: {
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.gray100,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    tabIcon: {
      padding: 6,
      borderRadius: 12,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.gray400,
    },
    tabLabelActive: {
      color: colors.amber,
    },
    monitoring: {
      padding: 24,
      paddingBottom: 96,
      gap: 24,
    },
    monitoringHeader: {
      gap: 2,
    },
    monitoringTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.black,
    },
    monitoringSubtitle: {
      color: colors.gray500,
      fontSize: 13,
    },
    gaugeCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    gauge: {
      width: 192,
      height: 192,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeCenter: {
      position: 'absolute',
      alignItems: 'center',
    },
    gaugeValue: {
      fontSize: 36,
      fontWeight: '900',
      color: colors.black,
    },
    gaugeLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    monitoringGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    monitoringCard: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
    },
    monitoringValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.black,
    },
    monitoringLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    connectionCard: {
      gap: 16,
    },
    connectionCardOn: {
      borderColor: colors.green100,
      backgroundColor: colors.green100,
    },
    connectionCardOff: {
      borderColor: colors.gray200,
      backgroundColor: colors.gray50,
    },
    connectionInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    connectionIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectionIconOn: {
      backgroundColor: colors.green100,
    },
    connectionIconOff: {
      backgroundColor: colors.gray200,
    },
    connectionText: {
      flex: 1,
    },
    connectionTitle: {
      fontWeight: '800',
      fontSize: 16,
      color: colors.gray900,
    },
    connectionSubtitle: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 2,
    },
    connectionButton: {
      width: '100%',
    },
  });
