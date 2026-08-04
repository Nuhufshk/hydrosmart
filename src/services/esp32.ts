import { ESP32Status, ESP32Settings } from '../types';

let currentStatus: ESP32Status = {
  ph: 6.4,
  ec: 1.8,
  temperature: 25.3,
  battery: 86,
  wifi: -58,
  pump1: false,
  pump2: false,
  pump3: false,
  relay: false,
  valve: false,
  mode: 'AUTO',
  uptime: '00:00:00'
};

let settings: ESP32Settings = {
  targetPH: 6.0,
  targetEC: 1.8,
  pumpRuntime: 5,
  measurementInterval: 2,
};

let autoStartedAt: number | null = Date.now();
let battery = 86;

const PH_TOLERANCE = 0.15;
const EC_TOLERANCE = 0.1;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const round = (v: number, places: number) => {
  const f = Math.pow(10, places);
  return Math.round(v * f) / f;
};

const formatUptime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const simulate = () => {
  const isAuto = currentStatus.mode === 'AUTO';

  // Temperature drifts slowly with ambient conditions
  currentStatus.temperature = round(clamp(currentStatus.temperature + rand(-0.15, 0.15), 20, 32), 1);

  // Wi-Fi signal jitters around its base strength
  currentStatus.wifi = Math.round(clamp(-58 + rand(-4, 4), -90, -35));

  // Battery drains over time, faster under load (active actuators)
  const load =
    (currentStatus.pump1 ? 1 : 0) +
    (currentStatus.pump2 ? 1 : 0) +
    (currentStatus.pump3 ? 1 : 0) +
    (currentStatus.valve ? 1 : 0) +
    (currentStatus.relay ? 1 : 0);
  battery = clamp(battery - (0.01 + load * 0.02), 1, 100);
  currentStatus.battery = round(battery, 1);

  if (isAuto) {
    // pH: auto-dosing holds it inside the tolerance band around targetPH
    const phErr = currentStatus.ph - settings.targetPH;
    if (phErr > PH_TOLERANCE) {
      currentStatus.ph -= 0.05;
      currentStatus.pump3 = true;
    } else if (phErr < -PH_TOLERANCE) {
      currentStatus.ph += 0.05;
      currentStatus.pump3 = false;
    } else {
      // natural upward drift keeps the adjuster cycling periodically
      currentStatus.ph += rand(-0.01, 0.02);
      currentStatus.pump3 = false;
    }
    currentStatus.ph = clamp(currentStatus.ph, 4.5, 8.5);

    // EC: nutrient pumps top up the solution when it drops out of band
    const ecErr = settings.targetEC - currentStatus.ec;
    if (ecErr > EC_TOLERANCE) {
      currentStatus.ec += 0.03;
      currentStatus.pump1 = true;
      currentStatus.pump2 = true;
    } else if (ecErr < -EC_TOLERANCE) {
      currentStatus.ec -= 0.03;
      currentStatus.pump1 = false;
      currentStatus.pump2 = false;
    } else {
      // plants consume nutrients, EC drifts downward until pumps re-engage
      currentStatus.ec += rand(-0.015, 0.0);
      currentStatus.pump1 = false;
      currentStatus.pump2 = false;
    }
    currentStatus.ec = clamp(currentStatus.ec, 0.6, 4.0);
  } else {
    // Manual: nothing corrects the water, values drift freely
    currentStatus.ph = clamp(currentStatus.ph + rand(-0.04, 0.04), 4.5, 8.5);
    currentStatus.ec = clamp(currentStatus.ec + rand(-0.02, 0.02), 0.6, 4.0);
  }

  currentStatus.ph = round(currentStatus.ph, 2);
  currentStatus.ec = round(currentStatus.ec, 2);
};

export const api = {
  async getStatus(): Promise<ESP32Status> {
    simulate();
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      ...currentStatus,
      uptime:
        currentStatus.mode === 'AUTO' && autoStartedAt !== null
          ? formatUptime(Date.now() - autoStartedAt)
          : '00:00:00',
    };
  },

  async togglePump(id: number, state: boolean): Promise<void> {
    if (currentStatus.mode === 'AUTO') return;
    const key = `pump${id}` as keyof ESP32Status;
    (currentStatus as any)[key] = state;
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async toggleRelay(state: boolean): Promise<void> {
    if (currentStatus.mode === 'AUTO') return;
    currentStatus.relay = state;
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async toggleValve(state: boolean): Promise<void> {
    if (currentStatus.mode === 'AUTO') return;
    currentStatus.valve = state;
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async setMode(mode: 'AUTO' | 'MANUAL'): Promise<void> {
    const wasAuto = currentStatus.mode === 'AUTO';
    currentStatus.mode = mode;
    if (mode === 'AUTO' && !wasAuto) autoStartedAt = Date.now();
    if (mode === 'MANUAL') autoStartedAt = null;
    await new Promise(resolve => setTimeout(resolve, 200));
  },

  async updateSettings(next: Partial<ESP32Settings>): Promise<void> {
    settings = { ...settings, ...next };
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
