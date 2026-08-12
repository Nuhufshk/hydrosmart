import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { ESP32Status, ESP32Settings } from '../types';
import { api as mockApi } from '../services/esp32';
import { esp32Client } from '../services/esp32Client';
import { useAppStore } from '../store/useAppStore';

export function useESP32() {
  const [status, setStatus] = useState<ESP32Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connected = useAppStore((s) => s.connected);
  const demo = useAppStore((s) => s.demo);
  const device = useAppStore((s) => s.device);
  const setConnected = useAppStore((s) => s.setConnected);
  const failures = useRef(0);
  const reconnecting = useRef(false);

  const reconnect = useCallback(async () => {
    if (reconnecting.current) return;
    const state = useAppStore.getState();
    if (state.demo || !state.connected || !state.device) return;
    reconnecting.current = true;
    try {
      await esp32Client.connect(state.device.ip, state.device.port ?? 80);
      state.setConnected(true);
    } catch {
      state.setConnected(false);
    } finally {
      reconnecting.current = false;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const data = demo ? await mockApi.getStatus() : await esp32Client.getStatus();
      setStatus(data);
      setError(null);
      failures.current = 0;
    } catch (err) {
      if (!esp32Client.isConnected) return;
      failures.current += 1;
      setError(failures.current >= 3 ? 'Lost connection to the device.' : 'Device is not responding.');
      if (failures.current >= 3 && !demo) {
        setConnected(false);
        esp32Client.disconnect();
      }
    } finally {
      setLoading(false);
    }
  }, [demo, setConnected]);

  useEffect(() => {
    if (!connected) {
      setStatus(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [connected, fetchStatus]);

  useEffect(() => {
    return esp32Client.onPartialStatus((partial) => {
      setStatus((prev) => {
        if (!prev) {
          return {
            ph: partial.ph ?? 0,
            ec: partial.ec ?? 0,
            temperature: partial.temperature ?? 25,
            battery: 0,
            wifi: -60,
            pump1: false,
            pump2: false,
            pump3: false,
            relay: false,
            valve: false,
            mode: 'MANUAL',
            pumpSpeed: 100,
            valveSpeed: 100,
            uptime: '00:00:00',
          };
        }
        return { ...prev, ...partial };
      });
      setError(null);
      failures.current = 0;
    });
  }, []);

  useEffect(() => {
    return esp32Client.onStatus((s) => {
      setStatus(s);
      setError(null);
      failures.current = 0;
    });
  }, []);

  useEffect(() => {
    return esp32Client.onConnectionChange((isConnected) => {
      if (!isConnected) reconnect();
    });
  }, [reconnect]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') reconnect();
    });
    return () => sub.remove();
  }, [reconnect]);

  useEffect(() => {
    if (connected && device && !esp32Client.isConnected) {
      reconnect();
    }
  }, [connected, device, reconnect]);

  const connect = useCallback(
    async (ip: string, port: number) => {
      if (demo) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setConnected(true);
        return;
      }
      await esp32Client.connect(ip, port);
      setConnected(true);
    },
    [demo, setConnected]
  );

  const disconnect = useCallback(() => {
    setConnected(false);
    esp32Client.disconnect();
  }, [setConnected]);

  const togglePump = async (id: number, state: boolean) => {
    if (!connected) return false;
    try {
      if (demo) {
        await mockApi.togglePump(id, state);
      } else {
        await esp32Client.togglePump(id, state);
      }
      await fetchStatus();
      return true;
    } catch (err) {
      console.error('Failed to toggle pump');
      return false;
    }
  };

  const toggleRelay = async (state: boolean) => {
    if (!connected) return false;
    try {
      if (demo) {
        await mockApi.toggleRelay(state);
      } else {
        await esp32Client.toggleRelay(state);
      }
      await fetchStatus();
      return true;
    } catch (err) {
      console.error('Failed to toggle relay');
      return false;
    }
  };

  const toggleValve = async (state: boolean) => {
    if (!connected) return false;
    try {
      if (demo) {
        await mockApi.toggleValve(state);
      } else {
        await esp32Client.toggleValve(state);
      }
      await fetchStatus();
      return true;
    } catch (err) {
      console.error('Failed to toggle valve');
      return false;
    }
  };

  const setMode = async (mode: 'AUTO' | 'MANUAL') => {
    if (!connected) return false;
    try {
      if (demo) {
        await mockApi.setMode(mode);
      } else {
        await esp32Client.setMode(mode);
      }
      await fetchStatus();
      return true;
    } catch (err) {
      console.error('Failed to set mode');
      return false;
    }
  };

  const updateSettings = async (settings: Partial<ESP32Settings>) => {
    if (!connected) return false;
    try {
      if (demo) {
        await mockApi.updateSettings(settings);
      } else {
        await esp32Client.updateSettings(settings);
      }
      await fetchStatus();
      return true;
    } catch (err) {
      console.error('Failed to update settings');
      return false;
    }
  };

  const setSpeed = async (speed: { pump?: number; valve?: number }) => {
    if (!connected) return false;
    try {
      if (demo) {
        await mockApi.setSpeed(speed);
      } else {
        await esp32Client.setSpeed(speed);
      }
      await fetchStatus();
      return true;
    } catch (err) {
      console.error('Failed to set speed');
      return false;
    }
  };

  return {
    status,
    loading,
    error,
    connected,
    refresh: fetchStatus,
    connect,
    disconnect,
    togglePump,
    toggleRelay,
    toggleValve,
    setMode,
    updateSettings,
    setSpeed,
  };
}
