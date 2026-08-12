import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfo } from '../types';

export interface DosingTargets {
  targetPH: number;
  targetEC: number;
}

interface AppState {
  device: DeviceInfo | null;
  isPaired: boolean;
  theme: 'light' | 'dark';
  notifications: boolean;
  targets: DosingTargets;
  connected: boolean;
  demo: boolean;
  setDevice: (device: DeviceInfo | null) => void;
  setPaired: (isPaired: boolean) => void;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  setTargets: (targets: Partial<DosingTargets>) => void;
  setConnected: (connected: boolean) => void;
  toggleDemo: () => void;
  forgetDevice: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      device: null,
      isPaired: false,
      theme: 'light',
      notifications: true,
      targets: { targetPH: 6.0, targetEC: 1.8 },
      connected: false,
      demo: false,
      setDevice: (device) => set({ device }),
      setPaired: (isPaired) => set({ isPaired }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
      setTargets: (targets) => set((state) => ({ targets: { ...state.targets, ...targets } })),
      setConnected: (connected) => set({ connected }),
      toggleDemo: () => set((state) => ({ demo: !state.demo })),
      forgetDevice: () => set({ device: null, isPaired: false, connected: false }),
    }),
    {
      name: 'hydrosmart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        device: state.device,
        isPaired: state.isPaired,
        theme: state.theme,
        notifications: state.notifications,
        targets: state.targets,
        connected: state.connected,
        demo: state.demo,
      }),
    }
  )
);
