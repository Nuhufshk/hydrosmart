import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Droplets } from 'lucide-react-native';
import { lightColors as colors } from '../theme';

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
    Animated.timing(rotate, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, delay: 500, useNativeDriver: true }),
      Animated.timing(titleY, { toValue: 0, duration: 600, delay: 500, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, { toValue: 1.25, duration: 750, useNativeDriver: true }),
        Animated.timing(dotScale, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [scale, rotate, titleOpacity, titleY, dotScale]);

  const rotation = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconBox, { transform: [{ scale }, { rotate: rotation }] }]}>
        <Droplets size={80} color={colors.amber} strokeWidth={2.2} />
      </Animated.View>

      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
        <Text style={styles.title}>HydroSmart</Text>
        <Text style={styles.subtitle}>Smart Nutrient Dosing</Text>
      </Animated.View>

      <Animated.View style={[styles.dots, { transform: [{ scale: dotScale }] }]}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotMid]} />
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconBox: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.black,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dotMid: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
