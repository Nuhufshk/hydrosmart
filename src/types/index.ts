export interface ESP32Status {
  ph: number;
  ec: number;
  temperature: number;
  battery: number;
  wifi: number;
  pump1: boolean;
  pump2: boolean;
  pump3: boolean;
  relay: boolean;
  valve: boolean;
  mode: 'AUTO' | 'MANUAL';
  pumpSpeed: number;
  valveSpeed: number;
  uptime: string;
}

export interface ESP32Settings {
  targetPH: number;
  targetEC: number;
  pumpRuntime: number;
  measurementInterval: number;
}

export interface DeviceInfo {
  name: string;
  ip: string;
  port?: number;
  mac: string;
  firmware: string;
  isPaired: boolean;
}

export interface SensorDataPoint {
  timestamp: string;
  ph: number;
  ec: number;
  temperature: number;
}
