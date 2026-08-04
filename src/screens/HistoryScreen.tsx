import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Download } from 'lucide-react-native';
import { Card, Button, Badge } from '../components/ui';
import { Chart } from '../components/Chart';
import { useTheme, type ThemeColors } from '../theme';

const generateData = (points: number) => {
  return Array.from({ length: points }, (_, i) => ({
    time: `${i}:00`,
    ph: 6.2 + Math.random() * 0.4,
    ec: 1.7 + Math.random() * 0.2,
    temp: 24 + Math.random() * 2,
  }));
};

const data24h = generateData(24);
const data7d = generateData(7);
const data30d = generateData(30);

const RANGES = ['24h', '7d', '30d'];

export const HistoryScreen = () => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [range, setRange] = useState('24h');
  const activeData = range === '24h' ? data24h : range === '7d' ? data7d : data30d;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Historical sensor data charts</Text>
        </View>
        <Button variant="secondary" size="sm">
          <Download size={16} color={colors.black} />
          Export
        </Button>
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[styles.rangePill, range === r && styles.rangePillActive]}
          >
            <Text style={[styles.rangeText, range === r && styles.rangeTextActive]}>{r.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.amber }]} />
            <Text style={styles.chartTitle}>pH Levels</Text>
          </View>
          <Badge color="gray">Avg: 6.4</Badge>
        </View>
        <Chart data={activeData.map((d) => d.ph)} color={colors.amber} area height={220} min={5.5} max={7.5} />
      </Card>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.blue500 }]} />
            <Text style={styles.chartTitle}>EC Levels</Text>
          </View>
          <Badge color="gray">Avg: 1.8</Badge>
        </View>
        <Chart data={activeData.map((d) => d.ec)} color={colors.blue500} height={220} min={1.0} max={2.5} />
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Max Daily Dosage</Text>
          <Text style={styles.statValue}>450ml</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Water Used</Text>
          <Text style={styles.statValue}>12.4L</Text>
        </Card>
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
    rangeRow: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.gray100,
      padding: 4,
      borderRadius: 12,
    },
    rangePill: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    rangePillActive: {
      backgroundColor: colors.white,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    rangeText: {
      fontWeight: '700',
      fontSize: 14,
      color: colors.gray500,
    },
    rangeTextActive: {
      color: colors.black,
    },
    chartCard: {
      padding: 8,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    chartTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    chartTitle: {
      fontWeight: '700',
      color: colors.gray700,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.gray50,
      borderWidth: 0,
    },
    statLabel: {
      color: colors.gray500,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.black,
    },
  });
