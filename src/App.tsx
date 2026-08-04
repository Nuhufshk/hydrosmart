import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LayoutDashboard, Activity, Zap, History, Settings as SettingsIcon } from 'lucide-react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card } from './components/ui';

import { SplashScreen } from './screens/SplashScreen';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { PairingScreen } from './screens/PairingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ControlScreen } from './screens/ControlScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useAppStore } from './store/useAppStore';
import { useESP32 } from './hooks/useESP32';
import { useTheme, type ThemeColors } from './theme';

type Tab = 'dashboard' | 'monitoring' | 'control' | 'history' | 'settings';

const BottomTab = ({ icon: Icon, label, active, onPress }: { icon: any; label: string; active: boolean; onPress: () => void }) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={styles.tab}>
      <View style={[styles.tabIcon, active && styles.tabIconActive]}>
        <Icon size={20} color={active ? colors.black : colors.gray400} />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
};

const FadeSlide = ({ children, slide = false }: { children: React.ReactNode; slide?: boolean }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const x = useRef(new Animated.Value(slide ? 20 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(x, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, x]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX: x }] }}>{children}</Animated.View>
  );
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

const MonitoringScreen = () => {
  const { status } = useESP32();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView contentContainerStyle={styles.monitoring}>
      <View style={styles.monitoringHeader}>
        <Text style={styles.monitoringTitle}>Live Monitoring</Text>
        <Text style={styles.monitoringSubtitle}>Real-time sensor telemetry</Text>
      </View>

      <Card style={styles.gaugeCard}>
        <Gauge value={status?.ph ?? 6.4} max={14} />
      </Card>

      <View style={styles.monitoringGrid}>
        <Card style={styles.monitoringCard}>
          <Text style={styles.monitoringValue}>{status?.ec?.toFixed(1) ?? '1.8'}</Text>
          <Text style={styles.monitoringLabel}>EC (mS/cm)</Text>
        </Card>
        <Card style={styles.monitoringCard}>
          <Text style={styles.monitoringValue}>
            {status?.temperature != null ? `${status.temperature.toFixed(1)}°C` : '25.3°C'}
          </Text>
          <Text style={styles.monitoringLabel}>Temperature</Text>
        </Card>
      </View>
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
  const [currentScreen, setCurrentScreen] = useState<'discovery' | 'pairing' | 'main'>('discovery');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    if (isPaired && connected) {
      setCurrentScreen('main');
      setActiveTab('dashboard');
    } else {
      setCurrentScreen('discovery');
    }
  }, [isPaired, connected]);

  const handleDeviceSelect = (device: any) => {
    setSelectedDevice(device);
    setCurrentScreen('pairing');
  };

  const handlePair = () => {
    setPaired(true);
    setConnected(true);
    setDevice(selectedDevice);
    setCurrentScreen('main');
  };

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <View style={[styles.app, { paddingTop: insets.top }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {currentScreen === 'discovery' && (
        <FadeSlide>
          <DiscoveryScreen onDeviceSelect={handleDeviceSelect} />
        </FadeSlide>
      )}

      {currentScreen === 'pairing' && (
        <FadeSlide slide>
          <PairingScreen device={selectedDevice} onBack={() => setCurrentScreen('discovery')} onPair={handlePair} />
        </FadeSlide>
      )}

      {currentScreen === 'main' && (
        <FadeSlide>
          <View style={styles.main}>
            <View style={styles.mainContent}>
              {activeTab === 'dashboard' && <DashboardScreen />}
              {activeTab === 'monitoring' && <MonitoringScreen />}
              {activeTab === 'control' && <ControlScreen />}
              {activeTab === 'history' && <HistoryScreen />}
              {activeTab === 'settings' && <SettingsScreen />}
            </View>

            <View style={[styles.nav, { paddingBottom: insets.bottom + 12 }]}>
              <BottomTab icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} onPress={() => setActiveTab('dashboard')} />
              <BottomTab icon={Activity} label="Monitor" active={activeTab === 'monitoring'} onPress={() => setActiveTab('monitoring')} />
              <BottomTab icon={Zap} label="Control" active={activeTab === 'control'} onPress={() => setActiveTab('control')} />
              <BottomTab icon={History} label="History" active={activeTab === 'history'} onPress={() => setActiveTab('history')} />
              <BottomTab icon={SettingsIcon} label="Settings" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
            </View>
          </View>
        </FadeSlide>
      )}
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
    tabIconActive: {
      backgroundColor: colors.amber,
    },
    tabLabel: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: colors.gray400,
    },
    tabLabelActive: {
      color: colors.black,
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
  });
