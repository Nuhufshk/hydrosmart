import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, ActivityIndicator } from 'react-native';
import { Settings2, Droplets, Wind, Check, Minus, Plus, Target } from 'lucide-react-native';
import { Button, Badge } from '../components/ui';
import { useESP32 } from '../hooks/useESP32';
import { useAppStore } from '../store/useAppStore';
import { useTheme, type ThemeColors } from '../theme';

const StepperRow = ({ label, value, min, max, step, decimals, onChange }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10) / 10));
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          disabled={atMin}
          onPress={() => onChange(clamp(value - step))}
          style={[styles.stepButton, atMin && styles.stepButtonDisabled]}
        >
          <Minus size={18} color={colors.white} />
        </Pressable>
        <Text style={styles.stepperValue}>{value.toFixed(decimals)}</Text>
        <Pressable
          disabled={atMax}
          onPress={() => onChange(clamp(value + step))}
          style={[styles.stepButton, atMax && styles.stepButtonDisabled]}
        >
          <Plus size={18} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
};

const ControlRow = ({ label, description, icon: Icon, active, onPress }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: active ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [active, anim]);

  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.controlRow, pressed && styles.controlRowPressed]}
    >
      <View style={[styles.controlIcon, active && styles.controlIconOn]}>
        <Icon size={20} color={active ? colors.black : colors.gray500} />
      </View>
      <View style={styles.controlInfo}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlDesc}>{description}</Text>
      </View>
      <View style={[styles.track, active && styles.trackOn]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
      </View>
    </Pressable>
  );
};

const ModeSelectCard = ({ label, icon: Icon, active, onPress }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeSelectCard,
        active && styles.modeSelectCardActive,
        pressed && styles.modeSelectCardPressed,
      ]}
    >
      <View style={styles.modeSelectTop}>
        <View style={[styles.modeSelectIcon, active && styles.modeSelectIconActive]}>
          <Icon size={20} color={active ? colors.black : colors.gray500} />
        </View>
        {active && <Check size={18} color={colors.amber} />}
      </View>
      <Text style={[styles.modeSelectLabel, active && styles.modeSelectLabelActive]}>{label}</Text>
    </Pressable>
  );
};

export const ControlScreen = () => {
  const { status, togglePump, toggleValve, setMode, updateSettings, setSpeed } = useESP32();
  const { targets, setTargets } = useAppStore();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [armed, setArmed] = useState(false);
  const [draftPH, setDraftPH] = useState(targets.targetPH);
  const [draftEC, setDraftEC] = useState(targets.targetEC);
  const [pump1Local, setPump1Local] = useState<boolean | undefined>(undefined);
  const [valveLocal, setValveLocal] = useState<boolean | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pumpSpeedLocal, setPumpSpeedLocal] = useState<number | undefined>(undefined);
  const [valveSpeedLocal, setValveSpeedLocal] = useState<number | undefined>(undefined);

  const isAuto = status?.mode === 'AUTO';

  const pump1 = pump1Local ?? status?.pump1 ?? false;
  const valve = valveLocal ?? status?.valve ?? false;
  const pumpSpeed = pumpSpeedLocal ?? status?.pumpSpeed ?? 100;
  const valveSpeed = valveSpeedLocal ?? status?.valveSpeed ?? 100;

  useEffect(() => {
    if (isAuto) setArmed(true);
  }, [isAuto]);

  useEffect(() => {
    if (isAuto) {
      setPump1Local(undefined);
      setValveLocal(undefined);
    }
  }, [isAuto]);

  useEffect(() => {
    setDraftPH(targets.targetPH);
    setDraftEC(targets.targetEC);
  }, [targets]);

  const handleToggle = (type: string, id: number | null, nextState: boolean) => {
    if (type === 'pump' && id === 1) {
      setPump1Local(nextState);
      if (nextState) setValveLocal(false);
    }
    if (type === 'valve') {
      setValveLocal(nextState);
      if (nextState) setPump1Local(false);
    }
    if (type === 'pump' && id !== null) togglePump(id, nextState);
    if (type === 'valve') toggleValve(nextState);
  };

  const selectManual = () => {
    if (!armed) return;
    if (isAuto) return; // must stop automated dosing via the Automated button first
    setArmed(false);
    setMode('MANUAL');
  };

  const selectAuto = () => {
    if (armed) return;
    setArmed(true);
  };

  const saveAndStart = async () => {
    setSaving(true);
    setSaveError(null);
    const next = { targetPH: draftPH, targetEC: draftEC };
    setTargets(next);
    const ok1 = await updateSettings(next);
    const ok2 = await setMode('AUTO');
    if (!ok1 || !ok2) {
      setSaveError('Could not reach the device. Check your connection and try again.');
    }
    setSaving(false);
  };

  const stopAuto = async () => {
    setSaving(true);
    setSaveError(null);
    const ok = await setMode('MANUAL');
    if (!ok) {
      setSaveError('Could not reach the device. Check your connection and try again.');
    } else {
      setArmed(false);
    }
    setSaving(false);
  };

  const handleSpeedChange = (which: 'pump' | 'valve') => (v: number) => {
    if (which === 'pump') setPumpSpeedLocal(v);
    else setValveSpeedLocal(v);
    setSpeed({ [which]: v });
  };

  const manualControls = [
    { type: 'pump', id: 1, label: 'Pump', description: 'Acid Solution', icon: Droplets, active: pump1 },
    { type: 'valve', id: null, label: 'Water Valve', description: 'Main Intake', icon: Wind, active: valve },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Control</Text>
          <Text style={styles.headerSubtitle}>Manual override & system mode</Text>
        </View>
        <Badge color={isAuto ? 'green' : 'orange'}>{isAuto ? 'Auto Mode' : 'Manual Mode'}</Badge>
      </View>

      <View style={styles.modeRow}>
        <ModeSelectCard label="Manual" icon={Settings2} active={!armed} onPress={selectManual} />
        <ModeSelectCard label="Auto" icon={Target} active={armed} onPress={selectAuto} />
      </View>

      {armed ? (
        <View style={styles.modeCard}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={colors.amber} />
            <Text style={styles.sectionLabel}>Dosing Targets</Text>
          </View>
          <Text style={styles.sectionHint}>
            {isAuto
              ? 'Automatic dosing is maintaining these values. Tap "Automated" to stop.'
              : 'Set your targets, then tap Save to start automatic dosing.'}
          </Text>
          <StepperRow label="Target pH" value={draftPH} min={5} max={7} step={0.1} decimals={1} onChange={setDraftPH} />
          <StepperRow label="Target EC (mS/cm)" value={draftEC} min={0.5} max={3.5} step={0.1} decimals={1} onChange={setDraftEC} />
          {saveError && (
            <Text style={styles.saveError}>⚠ {saveError}</Text>
          )}
          <Button style={styles.saveButton} onPress={isAuto ? stopAuto : saveAndStart} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={colors.black} /> : null}
            {saving ? 'Saving...' : isAuto ? 'Automated' : 'Save & Start Dosing'}
          </Button>
        </View>
      ) : (
        <View style={styles.modeCard}>
          <View style={styles.sectionHeader}>
            <Settings2 size={18} color={colors.amber} />
            <Text style={styles.sectionLabel}>Manual Controls</Text>
          </View>
          <Text style={styles.sectionHint}>Switch to the Auto card to set dosing targets.</Text>
          {manualControls.map((c, idx) => (
            <ControlRow
              key={idx}
              label={c.label}
              description={c.description}
              icon={c.icon}
              active={c.active}
              onPress={() => handleToggle(c.type, c.id, !c.active)}
            />
          ))}
          <View style={styles.speedSection}>
            <Text style={styles.speedTitle}>Output Speed</Text>
            <StepperRow
              label="Pump Speed (%)"
              value={pumpSpeed}
              min={0}
              max={100}
              step={10}
              decimals={0}
              onChange={handleSpeedChange('pump')}
            />
            <StepperRow
              label="Valve Speed (%)"
              value={valveSpeed}
              min={0}
              max={100}
              step={10}
              decimals={0}
              onChange={handleSpeedChange('valve')}
            />
          </View>
        </View>
      )}

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
    modeRow: {
      flexDirection: 'row',
      gap: 16,
    },
    modeSelectCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      gap: 10,
      borderWidth: 2,
      borderColor: colors.gray100,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    modeSelectCardActive: {
      borderColor: colors.amber,
      backgroundColor: 'rgba(255,184,0,0.06)',
    },
    modeSelectCardPressed: {
      opacity: 0.85,
    },
    modeSelectTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modeSelectIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeSelectIconActive: {
      backgroundColor: colors.amber,
    },
    modeSelectLabel: {
      fontWeight: '800',
      fontSize: 16,
      color: colors.gray900,
    },
    modeSelectLabelActive: {
      color: colors.amber,
    },
    modeCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.gray200,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionLabel: {
      fontWeight: '700',
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.gray900,
    },
    sectionHint: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 6,
      marginBottom: 16,
    },
    controlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray100,
    },
    controlRowPressed: {
      opacity: 0.6,
    },
    controlIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    controlIconOn: {
      backgroundColor: colors.amber,
    },
    controlInfo: {
      flex: 1,
    },
    controlLabel: {
      fontWeight: '700',
      color: colors.gray900,
    },
    controlDesc: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 2,
    },
    track: {
      width: 56,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gray200,
      padding: 4,
      justifyContent: 'center',
    },
    trackOn: {
      backgroundColor: colors.amber,
    },
    knob: {
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
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 14,
    },
    stepperLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.gray900,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stepButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.gray100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonDisabled: {
      opacity: 0.35,
    },
    stepperValue: {
      minWidth: 64,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '800',
      color: colors.black,
      fontVariant: ['tabular-nums'],
    },
    speedSection: {
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.gray100,
    },
    speedTitle: {
      fontWeight: '700',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.gray500,
      marginBottom: 12,
    },
    saveButton: {
      width: '100%',
      marginTop: 4,
    },
    saveError: {
      color: colors.red600,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
    },
  });
