import { useState, useEffect, useCallback } from 'react';
import { ESP32Status, ESP32Settings } from '../types';
import { api } from '../services/esp32';
import { useAppStore } from '../store/useAppStore';

export function useESP32() {
  const [status, setStatus] = useState<ESP32Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connected = useAppStore((s) => s.connected);
  const setConnected = useAppStore((s) => s.setConnected);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to ESP32');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const connect = useCallback(() => setConnected(true), [setConnected]);
  const disconnect = useCallback(() => setConnected(false), [setConnected]);

  const togglePump = async (id: number, state: boolean) => {
    if (!connected) return;
    try {
      await api.togglePump(id, state);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to toggle pump');
    }
  };

  const toggleRelay = async (state: boolean) => {
    if (!connected) return;
    try {
      await api.toggleRelay(state);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to toggle relay');
    }
  };

  const toggleValve = async (state: boolean) => {
    if (!connected) return;
    try {
      await api.toggleValve(state);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to toggle valve');
    }
  };

  const setMode = async (mode: 'AUTO' | 'MANUAL') => {
    if (!connected) return;
    try {
      await api.setMode(mode);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to set mode');
    }
  };

  const updateSettings = async (settings: Partial<ESP32Settings>) => {
    if (!connected) return;
    try {
      await api.updateSettings(settings);
      await fetchStatus();
    } catch (err) {
      console.error('Failed to update settings');
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
  };
}
