import { ESP32Status, ESP32Settings } from '../types';

const CONNECT_TIMEOUT_MS = 6000;
const REQUEST_TIMEOUT_MS = 2000;
const WS_OPEN = 1;

interface PendingRequest {
  resolve: (msg: any) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

type ConnectionListener = (connected: boolean) => void;
type StatusListener = (status: ESP32Status) => void;
type PartialStatusListener = (partial: Partial<ESP32Status>) => void;

class Esp32Client {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private listeners = new Set<ConnectionListener>();
  private statusListeners = new Set<StatusListener>();
  private partialListeners = new Set<PartialStatusListener>();
  private socketConnected = false;

  get isConnected() {
    return this.socketConnected;
  }

  onConnectionChange(cb: ConnectionListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  onStatus(cb: StatusListener): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  onPartialStatus(cb: PartialStatusListener): () => void {
    this.partialListeners.add(cb);
    return () => this.partialListeners.delete(cb);
  }

  private notify(connected: boolean) {
    this.socketConnected = connected;
    this.listeners.forEach((cb) => cb(connected));
  }

  private notifyStatus(status: ESP32Status) {
    this.statusListeners.forEach((cb) => cb(status));
  }

  private notifyPartial(partial: Partial<ESP32Status>) {
    this.partialListeners.forEach((cb) => cb(partial));
  }

  connect(ip: string, port: number): Promise<void> {
    this.closeSocket();
    return new Promise<void>((resolve, reject) => {
      const url = `ws://${ip}:${port}`;
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        reject(new Error('The IP address or port is not valid.'));
        return;
      }
      this.ws = ws;

      let settled = false;
      let timer: ReturnType<typeof setTimeout>;
      const fail = (message: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.notify(false);
        reject(new Error(message));
      };

      timer = setTimeout(() => {
        fail(`Connection timed out. No device found at ${url}.`);
      }, CONNECT_TIMEOUT_MS);

      ws.onopen = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.notify(true);
        resolve();
      };

      ws.onerror = () => {
        console.warn('[esp32Client] socket error');
        fail(`Could not connect to ${url}. Check that the IP address and port are correct.`);
      };

      ws.onmessage = (event) => this.handleMessage(String(event.data));

      ws.onclose = (event: any) => {
        console.warn('[esp32Client] socket closed', { code: event?.code ?? -1, reason: event?.reason ?? '' });
        this.rejectAll(new Error('Connection to the device was lost.'));
        this.notify(false);
      };
    });
  }

  disconnect() {
    this.closeSocket();
    this.notify(false);
  }

  private closeSocket() {
    this.socketConnected = false;
    const ws = this.ws;
    this.ws = null;
    this.rejectAll(new Error('Connection closed.'));
    if (ws) {
      try {
        ws.onopen = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.close();
      } catch {
        // ignore
      }
    }
  }

  getStatus(): Promise<ESP32Status> {
    return this.request('get_status').then((msg) => msg.data as ESP32Status);
  }

  togglePump(id: number, state: boolean): Promise<void> {
    return this.request('command', { command: 'set_pump', pump: id, state });
  }

  toggleRelay(state: boolean): Promise<void> {
    return this.request('command', { command: 'set_relay', state });
  }

  toggleValve(state: boolean): Promise<void> {
    return this.request('command', { command: 'set_valve', state });
  }

  setMode(mode: 'AUTO' | 'MANUAL'): Promise<void> {
    return this.request('command', { command: 'set_mode', mode });
  }

  updateSettings(settings: Partial<ESP32Settings>): Promise<void> {
    return this.request('command', { command: 'set_settings', settings });
  }

  setSpeed(speed: { pump?: number; valve?: number }): Promise<void> {
    return this.request('command', { command: 'set_speed', speed });
  }

  private request(type: string, payload: Record<string, unknown> = {}, timeout = REQUEST_TIMEOUT_MS): Promise<any> {
    if (!this.ws || this.ws.readyState !== WS_OPEN) {
      return Promise.reject(new Error('Not connected to the device.'));
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        console.warn('[esp32Client] request timed out', { type, id });
        reject(new Error('The device did not respond in time.'));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.ws!.send(JSON.stringify({ id, type, ...payload }));
    });
  }

  private handleMessage(raw: string) {
    let msg: {
      id?: number;
      type?: string;
      data?: unknown;
      message?: string;
      event?: string;
      ph?: number;
      ec?: number;
      temperature?: number;
    };
    try {
      msg = JSON.parse(raw);
    } catch {
      console.warn('[esp32Client] non-JSON message', raw.slice(0, 120));
      return;
    }
    if (msg.event === 'SENSOR_DATA') {
      const partial: Partial<ESP32Status> = {};
      if (typeof msg.ph === 'number') partial.ph = msg.ph;
      if (typeof msg.ec === 'number') partial.ec = msg.ec;
      if (typeof msg.temperature === 'number') partial.temperature = msg.temperature;
      this.notifyPartial(partial);
      return;
    }
    if (msg.event) {
      return;
    }
    if (msg.type === 'status' && msg.data) {
      this.notifyStatus(msg.data as ESP32Status);
    }
    if (msg.id == null) {
      console.log('[esp32Client] message without id', JSON.stringify(msg));
      return;
    }
    const pending = this.pending.get(msg.id);
    if (!pending) {
      console.log('[esp32Client] response for unknown request id', msg.id, JSON.stringify(msg));
      return;
    }
    this.pending.delete(msg.id);
    clearTimeout(pending.timer);
    if (msg.type === 'error') {
      pending.reject(new Error(msg.message ?? 'The device returned an error.'));
    } else {
      pending.resolve(msg);
    }
  }

  private rejectAll(err: Error) {
    this.pending.forEach((p) => {
      clearTimeout(p.timer);
      p.reject(err);
    });
    this.pending.clear();
  }
}

export const esp32Client = new Esp32Client();
