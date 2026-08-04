import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable, Animated } from 'react-native';
import { Power, Settings2, Droplets, Wind, Lock, AlertCircle, Minus, Plus, Target } from 'lucide-react-native';
import { Card, Button, Badge } from '../components/ui';
import { useESP32 } from '../hooks/useESP32';
import { useAppStore } from '../store/useAppStore';
import { useTheme, type ThemeColors } from '../theme';

const ToggleCard = ({ label, description, icon: Icon, active, disabled, onChange }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: active ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [active, anim]);

  const knobX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  return (
    <Card style={[styles.toggleCard, active && styles.toggleCardOn, disabled && styles.toggleCardDisabled]}>
      <View style={styles.toggleTop}>
        <View style={[styles.toggleIcon, active && styles.toggleIconOn]}>
          <Icon size={24} color={active ? colors.black : colors.gray400} />
        </View>
        <Pressable
          disabled={disabled}
          onPress={() => !disabled && onChange(!active)}
          style={[styles.track, active && styles.trackOn, disabled && styles.trackDisabled]}
        >
          <Animated.View style={[styles.knob, { transform: [{ translateX: knobX }] }]} />
        </Pressable>
      </View>
      <View>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
    </Card>
  );
};

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
          <Minus size={18} color={colors.black} />
        </Pressable>
        <Text style={styles.stepperValue}>{value.toFixed(decimals)}</Text>
        <Pressable
          disabled={atMax}
          onPress={() => onChange(clamp(value + step))}
          style={[styles.stepButton, atMax && styles.stepButtonDisabled]}
        >
          <Plus size={18} color={colors.black} />
        </Pressable>
      </View>
    </View>
  );
};

const TargetsModal = ({ visible, targets, armOnSave, onClose, onSave }: any) => {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draftPH, setDraftPH] = useState(targets.targetPH);
  const [draftEC, setDraftEC] = useState(targets.targetEC);

  useEffect(() => {
    if (visible) {
      setDraftPH(targets.targetPH);
      setDraftEC(targets.targetEC);
    }
  }, [visible, targets]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalWrap}>
        <View style={styles.modalCard}>
          <View style={styles.modalIcon}>
            <Target size={32} color={colors.amber} />
          </View>
          <Text style={styles.modalTitle}>Dosing Targets</Text>
          <Text style={styles.modalText}>
            {armOnSave
              ? 'Set the target values automatic dosing should maintain.'
              : 'Adjust the values automatic dosing maintains.'}
          </Text>

          <StepperRow label="Target pH" value={draftPH} min={5} max={7} step={0.1} decimals={1} onChange={setDraftPH} />
          <StepperRow label="Target EC (mS/cm)" value={draftEC} min={0.5} max={3.5} step={0.1} decimals={1} onChange={setDraftEC} />

          <View style={styles.modalActions}>
            <Button variant="secondary" style={styles.modalAction} onPress={onClose}>
              Cancel
            </Button>
            <Button style={styles.modalAction} onPress={() => onSave(draftPH, draftEC)}>
              {armOnSave ? 'Save & Enable Auto' : 'Save Targets'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const ControlScreen = () => {
  const { status, togglePump, toggleValve, toggleRelay, setMode, updateSettings } = useESP32();
  const { targets, setTargets } = useAppStore();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showConfirm, setShowConfirm] = useState<any>(null);
  const [showTargets, setShowTargets] = useState(false);
  const [armOnSave, setArmOnSave] = useState(false);

  const isAuto = status?.mode === 'AUTO';

  const modeAnim = useRef(new Animated.Value(isAuto ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(modeAnim, { toValue: isAuto ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [isAuto, modeAnim]);

  const modeKnobX = modeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 32] });

  const handleToggle = (type: string, id: number | null, nextState: boolean) => {
    if (isAuto) return;
    setShowConfirm({ type, id, nextState });
  };

  const confirmAction = async () => {
    if (!showConfirm) return;
    const { type, id, nextState } = showConfirm;
    if (type === 'pump' && id !== null) await togglePump(id, nextState);
    if (type === 'valve') await toggleValve(nextState);
    if (type === 'relay') await toggleRelay(nextState);
    setShowConfirm(null);
  };

  const handleModeToggle = () => {
    if (isAuto) {
      setMode('MANUAL');
      return;
    }
    setArmOnSave(true);
    setShowTargets(true);
  };

  const openTargets = () => {
    setArmOnSave(false);
    setShowTargets(true);
  };

  const saveTargets = async (targetPH: number, targetEC: number) => {
    setTargets({ targetPH, targetEC });
    await updateSettings({ targetPH, targetEC });
    if (armOnSave) await setMode('AUTO');
    setShowTargets(false);
  };

  const toggles = [
    { label: 'Pump 1', description: 'Nutrient A', icon: Droplets, active: status?.pump1, onChange: (n: boolean) => handleToggle('pump', 1, n) },
    { label: 'Pump 2', description: 'Nutrient B', icon: Droplets, active: status?.pump2, onChange: (n: boolean) => handleToggle('pump', 2, n) },
    { label: 'Pump 3', description: 'pH Adjuster', icon: Droplets, active: status?.pump3, onChange: (n: boolean) => handleToggle('pump', 3, n) },
    { label: 'Water Valve', description: 'Main Intake', icon: Wind, active: status?.valve, onChange: (n: boolean) => handleToggle('valve', null, n) },
    { label: 'Aux Relay', description: 'Extra Equipment', icon: Power, active: status?.relay, onChange: (n: boolean) => handleToggle('relay', null, n) },
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

      <View style={styles.modeCard}>
        <View style={styles.modeRow}>
          <View style={styles.modeInfo}>
            <View style={styles.modeIcon}>
              <Settings2 size={24} color={colors.amber} />
            </View>
            <View>
              <Text style={styles.modeTitle}>Automatic Dosing</Text>
              <Text style={styles.modeSubtitle}>
                Maintains pH {targets.targetPH.toFixed(1)} · EC {targets.targetEC.toFixed(1)}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleModeToggle} style={[styles.modeTrack, isAuto && styles.modeTrackOn]}>
            <Animated.View style={[styles.modeKnob, { transform: [{ translateX: modeKnobX }] }]} />
          </Pressable>
        </View>
        {isAuto && (
          <Pressable onPress={openTargets} style={styles.adjustLink}>
            <Settings2 size={14} color={colors.amber} />
            <Text style={styles.adjustLinkText}>Adjust targets</Text>
          </Pressable>
        )}
      </View>

      {isAuto && (
        <View style={styles.infoBanner}>
          <Lock size={20} color={colors.blue500} />
          <Text style={styles.infoBannerText}>
            Manual controls are disabled while Automatic Mode is active. Switch to Manual to take control.
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        {toggles.map((t, idx) => (
          <ToggleCard key={idx} {...t} disabled={isAuto} />
        ))}
      </View>

      <Modal visible={!!showConfirm} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowConfirm(null)} />
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <AlertCircle size={32} color={colors.orange600} />
            </View>
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalText}>
              Are you sure you want to turn {showConfirm?.type} {showConfirm?.id || ''} {showConfirm?.nextState ? 'ON' : 'OFF'}?
            </Text>
            <View style={styles.modalActions}>
              <Button variant="secondary" style={styles.modalAction} onPress={() => setShowConfirm(null)}>
                Cancel
              </Button>
              <Button style={styles.modalAction} onPress={confirmAction}>
                Confirm
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <TargetsModal
        visible={showTargets}
        targets={targets}
        armOnSave={armOnSave}
        onClose={() => setShowTargets(false)}
        onSave={saveTargets}
      />
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
    modeCard: {
      backgroundColor: '#000000',
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    modeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modeIcon: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
    },
    modeTitle: {
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modeSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.5)',
    },
    modeTrack: {
      width: 64,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 4,
      justifyContent: 'center',
    },
    modeTrackOn: {
      backgroundColor: colors.amber,
    },
    modeKnob: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
    },
    adjustLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.15)',
    },
    adjustLinkText: {
      color: colors.amber,
      fontSize: 13,
      fontWeight: '700',
    },
    infoBanner: {
      backgroundColor: colors.blue50,
      borderWidth: 1,
      borderColor: colors.blue100,
      padding: 16,
      borderRadius: 16,
      flexDirection: 'row',
      gap: 12,
    },
    infoBannerText: {
      flex: 1,
      color: colors.blue700,
      fontWeight: '500',
      fontSize: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    toggleCard: {
      width: '47%',
      flexGrow: 1,
      gap: 16,
    },
    toggleCardOn: {
      backgroundColor: 'rgba(255,184,0,0.05)',
      borderColor: colors.amber,
    },
    toggleCardDisabled: {
      opacity: 0.6,
    },
    toggleTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    toggleIcon: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.gray100,
    },
    toggleIconOn: {
      backgroundColor: colors.amber,
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
    trackDisabled: {
      opacity: 0.5,
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
    toggleLabel: {
      fontWeight: '700',
      color: colors.gray900,
    },
    toggleDescription: {
      fontSize: 12,
      color: colors.gray500,
      marginTop: 2,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
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
      borderRadius: 32,
      padding: 24,
      alignItems: 'center',
    },
    modalIcon: {
      padding: 16,
      backgroundColor: colors.orange100,
      borderRadius: 999,
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.black,
      marginBottom: 8,
    },
    modalText: {
      color: colors.gray500,
      textAlign: 'center',
      marginBottom: 24,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 16,
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
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    modalAction: {
      flex: 1,
    },
  });
