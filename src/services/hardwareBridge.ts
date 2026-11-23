/**
 * Hardware-Ready Telemetry Bridge for NXP FRDM-MCXN236 Wearable Microvascular Monitor
 *
 * Supports three live transport modes:
 *  1. Simulator Mode: Deterministic physiological generator for bench & clinical UI validation
 *  2. Web Bluetooth (BLE UART / Nordic NUS-compatible GATT profile)
 *  3. Web Serial (USB-UART bridge to FRDM-MCXN236 MCU-Link VCOM port)
 *
 * Strictly adheres to MAX30102 clinical spec: extracts PPG AC, DC, Perfusion Index (PI%),
 * and Signal-to-Noise Ratio (SNR). SpO2 computation is intentionally excluded.
 */

import type {
  MlVasospasmClass,
  SimulatorScenario,
  TelemetryPacket,
} from '../types/telemetry';

// ============================================================================
// FRDM-MCXN236 BLE GATT & USB-UART HARDWARE CONSTANTS
// ============================================================================

/** Nordic UART Service (NUS) UUID used by the FRDM-MCXN236 BLE peripheral */
export const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

/** TX Characteristic UUID: Central -> Peripheral (Commands: RTC_SYNC, CAL_START, SD_DUMP) */
export const TX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

/** RX Characteristic UUID: Peripheral -> Central (Notifications: 1Hz/10Hz JSON/CSV packets) */
export const RX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

/** USB-UART Serial Baud Rate for FRDM-MCXN236 MCU-Link VCOM */
export const BAUD_RATE = 115200;

/** Expected CSV Column Order when firmware streams compact ASCII frames */
export const CSV_TELEMETRY_COLUMNS = [
  'rtc_time',
  'ppg_ac',
  'ppg_dc',
  'perfusion_index',
  'ppg_snr',
  't_fingertip',
  't_dorsal',
  'delta_t',
  'cooling_rate',
  'rgb_r',
  'rgb_g',
  'rgb_b',
  'rgb_clear',
  'pallor_index',
  'accel_x',
  'accel_y',
  'accel_z',
  'motion_score',
  'high_motion_flag',
  'hand_elevation_deg',
  'ambient_temp',
  'ambient_humidity',
  'hw_event_btn',
  'battery_pct',
  'sd_free_mb',
  'ml_class',
  'ml_confidence',
] as const;

// Minimal Web Bluetooth / Web Serial runtime type guards (avoids global DOM lib gaps)
interface BleCharacteristicLike {
  writeValue: (data: BufferSource) => Promise<void>;
  startNotifications: () => Promise<BleCharacteristicLike>;
  addEventListener: (type: string, listener: (ev: Event) => void) => void;
  value?: DataView;
}

interface BleServerLike {
  connected: boolean;
  disconnect: () => void;
  getPrimaryService: (uuid: string) => Promise<{
    getCharacteristic: (uuid: string) => Promise<BleCharacteristicLike>;
  }>;
}

interface BleDeviceLike {
  id: string;
  name?: string;
  gatt?: {
    connect: () => Promise<BleServerLike>;
    connected: boolean;
  };
  addEventListener: (type: string, listener: () => void) => void;
}

interface SerialPortLike {
  open: (opts: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

// ============================================================================
// TELEMETRY PACKET PARSER (JSON & CSV)
// ============================================================================

function toFiniteNumber(val: unknown, fallback = 0): number {
  const num = typeof val === 'number' ? val : Number(val);
  return Number.isFinite(num) ? num : fallback;
}

function toBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const norm = val.trim().toLowerCase();
    return norm === '1' || norm === 'true' || norm === 'yes';
  }
  return false;
}

function clampMlClass(val: unknown): MlVasospasmClass {
  const n = Math.round(toFiniteNumber(val, 0));
  if (n === 2) return 2;
  if (n === 1) return 1;
  return 0;
}

/**
 * Parses a raw line (JSON object string or CSV line) emitted by the FRDM-MCXN236
 * firmware into a strongly-typed TelemetryPacket.
 * Returns null for incomplete/malformed frames without throwing.
 */
export function parseTelemetryLine(rawLine: string): TelemetryPacket | null {
  const trimmed = rawLine.trim();
  if (!trimmed) return null;

  // Reject any accidental SpO2-only malformed payloads if required PPG fields missing
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      if (obj.ppg_ac === undefined && obj.perfusion_index === undefined && obj.t_fingertip === undefined) {
        return null;
      }
      const tFingertip = toFiniteNumber(obj.t_fingertip, 32.0);
      const tDorsal = toFiniteNumber(obj.t_dorsal, 33.2);
      const deltaT =
        obj.delta_t !== undefined
          ? toFiniteNumber(obj.delta_t)
          : Number((tFingertip - tDorsal).toFixed(2));
      const ppgAc = toFiniteNumber(obj.ppg_ac, 180);
      const ppgDc = Math.max(1, toFiniteNumber(obj.ppg_dc, 12000));
      const pi =
        obj.perfusion_index !== undefined
          ? toFiniteNumber(obj.perfusion_index)
          : Number(((ppgAc / ppgDc) * 100).toFixed(2));

      const rawConf = toFiniteNumber(obj.ml_confidence, 0.92);
      const normalizedConf = rawConf > 1 ? Math.min(1, rawConf / 100) : Math.max(0, rawConf);

      return {
        ppg_ac: Number(ppgAc.toFixed(2)),
        ppg_dc: Number(ppgDc.toFixed(1)),
        perfusion_index: Number(pi.toFixed(2)),
        ppg_snr: Number(toFiniteNumber(obj.ppg_snr, 22.4).toFixed(1)),
        t_fingertip: Number(tFingertip.toFixed(2)),
        t_dorsal: Number(tDorsal.toFixed(2)),
        delta_t: Number(deltaT.toFixed(2)),
        cooling_rate: Number(toFiniteNumber(obj.cooling_rate, 0).toFixed(2)),
        rgb_r: Math.round(Math.min(255, Math.max(0, toFiniteNumber(obj.rgb_r, 210)))),
        rgb_g: Math.round(Math.min(255, Math.max(0, toFiniteNumber(obj.rgb_g, 165)))),
        rgb_b: Math.round(Math.min(255, Math.max(0, toFiniteNumber(obj.rgb_b, 148)))),
        rgb_clear: Math.round(toFiniteNumber(obj.rgb_clear, 2400)),
        pallor_index: Number(Math.min(1, Math.max(0, toFiniteNumber(obj.pallor_index, 0.14))).toFixed(3)),
        accel_x: Number(toFiniteNumber(obj.accel_x, 0.02).toFixed(3)),
        accel_y: Number(toFiniteNumber(obj.accel_y, -0.04).toFixed(3)),
        accel_z: Number(toFiniteNumber(obj.accel_z, 0.98).toFixed(3)),
        motion_score: Number(Math.max(0, toFiniteNumber(obj.motion_score, 0.04)).toFixed(3)),
        high_motion_flag: toBoolean(obj.high_motion_flag),
        hand_elevation_deg: Number(toFiniteNumber(obj.hand_elevation_deg, -12).toFixed(1)),
        ambient_temp: Number(toFiniteNumber(obj.ambient_temp, 22.5).toFixed(1)),
        ambient_humidity: Number(toFiniteNumber(obj.ambient_humidity, 46.0).toFixed(1)),
        hw_event_btn: toBoolean(obj.hw_event_btn),
        rtc_time: typeof obj.rtc_time === 'string' && obj.rtc_time.length > 0 ? obj.rtc_time : new Date().toISOString(),
        battery_pct: Math.round(Math.min(100, Math.max(0, toFiniteNumber(obj.battery_pct, 88)))),
        sd_free_mb: Number(Math.max(0, toFiniteNumber(obj.sd_free_mb, 3420)).toFixed(1)),
        ml_class: clampMlClass(obj.ml_class),
        ml_confidence: Number(normalizedConf.toFixed(3)),
      };
    } catch {
      return null;
    }
  }

  // CSV Frame format: matches CSV_TELEMETRY_COLUMNS (27 fields)
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((s) => s.trim());
    if (parts[0] === 'rtc_time' || parts.length < 25) {
      return null;
    }
    const obj: Record<string, unknown> = {};
    CSV_TELEMETRY_COLUMNS.forEach((col, idx) => {
      if (idx < parts.length) {
        obj[col] = parts[idx];
      }
    });
    return parseTelemetryLine(JSON.stringify(obj));
  }

  return null;
}

/**
 * Formats an RTC synchronization command frame to transmit to the FRDM-MCXN236 MCU
 * over BLE TX_CHAR_UUID or USB-UART TX.
 */
export function buildRtcSyncCommand(date: Date = new Date()): string {
  const unixSec = Math.floor(date.getTime() / 1000);
  const iso = date.toISOString();
  return JSON.stringify({ cmd: 'RTC_SYNC', unix: unixSec, iso }) + '\n';
}

// ============================================================================
// DETERMINISTIC PHYSIOLOGICAL SIMULATOR ENGINE
// ============================================================================

export class TelemetrySimulator {
  private scenario: SimulatorScenario = 'normal';
  private tick = 0;
  private hwButtonPending = false;
  private currentPi = 2.85;
  private currentTfingertip = 32.4;
  private currentTdorsal = 33.1;
  private currentPallor = 0.14;
  private currentAmbientTemp = 22.8;

  public setScenario(scenario: SimulatorScenario): void {
    this.scenario = scenario;
  }

  public getScenario(): SimulatorScenario {
    return this.scenario;
  }

  public triggerHardwareButton(): void {
    this.hwButtonPending = true;
  }

  public nextPacket(now: Date = new Date()): TelemetryPacket {
    this.tick += 1;
    const t = this.tick;

    // Target physiological setpoints per clinical scenario
    let targetPi = 2.85;
    let targetTfingertip = 32.4;
    let targetTdorsal = 33.1;
    let targetPallor = 0.14;
    let targetAmbient = 22.8;
    let motionBase = 0.04;
    let highMotion = false;
    let mlClass: MlVasospasmClass = 0;
    let mlConf = 0.96;

    if (this.scenario === 'cooling') {
      targetPi = 1.25;
      targetTfingertip = 26.8;
      targetTdorsal = 32.5;
      targetPallor = 0.48;
      targetAmbient = 14.2;
      mlClass = 1;
      mlConf = 0.89;
    } else if (this.scenario === 'vasospasm') {
      targetPi = 0.28;
      targetTfingertip = 21.4;
      targetTdorsal = 32.2;
      targetPallor = 0.86;
      targetAmbient = 11.5;
      mlClass = 2;
      mlConf = 0.94;
    } else if (this.scenario === 'motion_artifact') {
      targetPi = this.currentPi;
      targetTfingertip = this.currentTfingertip;
      targetTdorsal = this.currentTdorsal;
      targetPallor = this.currentPallor;
      motionBase = 0.82;
      highMotion = true;
      mlClass = this.currentPi < 0.7 ? 2 : this.currentPi < 1.6 ? 1 : 0;
      mlConf = 0.42;
    }

    // First-order physiological smoothing for realistic transitions
    const prevTf = this.currentTfingertip;
    this.currentPi += (targetPi - this.currentPi) * 0.26 + Math.sin(t * 0.7) * 0.04;
    this.currentTfingertip += (targetTfingertip - this.currentTfingertip) * 0.16 + Math.cos(t * 0.4) * 0.03;
    this.currentTdorsal += (targetTdorsal - this.currentTdorsal) * 0.08;
    this.currentPallor += (targetPallor - this.currentPallor) * 0.22;
    this.currentAmbientTemp += (targetAmbient - this.currentAmbientTemp) * 0.2;

    const clampedPi = Math.max(0.08, Number(this.currentPi.toFixed(2)));
    const dc = 12450 + Math.sin(t * 0.15) * 120;
    const ac = Number(((clampedPi / 100) * dc).toFixed(2));
    const deltaT = Number((this.currentTfingertip - this.currentTdorsal).toFixed(2));
    // dT/dt scaled to °C/min (assuming 1 Hz packet rate -> *60, damped for readability)
    const coolingRate = Number(((this.currentTfingertip - prevTf) * 12).toFixed(2));

    // Spectral reflectance shifts under white LED: normal warm pink -> pale/blanched -> cyanotic
    let r = 216 - this.currentPallor * 28;
    let g = 162 + this.currentPallor * 36;
    let b = 148 + this.currentPallor * 52;
    if (this.scenario === 'vasospasm') {
      // Blanched white-to-cyanotic shift
      r = 188 + Math.sin(t * 0.5) * 3;
      g = 196 + Math.cos(t * 0.5) * 3;
      b = 212 + Math.sin(t * 0.3) * 4;
    }

    const motionScore = highMotion
      ? Number((motionBase + Math.abs(Math.sin(t * 2.1)) * 0.35).toFixed(3))
      : Number((motionBase + Math.abs(Math.sin(t * 0.9)) * 0.025).toFixed(3));

    const snr = highMotion ? 6.4 : Number((24.5 - this.currentPallor * 6.5 + Math.sin(t * 0.6) * 0.8).toFixed(1));

    const btnState = this.hwButtonPending;
    this.hwButtonPending = false;

    return {
      ppg_ac: ac,
      ppg_dc: Number(dc.toFixed(1)),
      perfusion_index: clampedPi,
      ppg_snr: snr,
      t_fingertip: Number(this.currentTfingertip.toFixed(2)),
      t_dorsal: Number(this.currentTdorsal.toFixed(2)),
      delta_t: deltaT,
      cooling_rate: coolingRate,
      rgb_r: Math.round(Math.min(255, Math.max(0, r))),
      rgb_g: Math.round(Math.min(255, Math.max(0, g))),
      rgb_b: Math.round(Math.min(255, Math.max(0, b))),
      rgb_clear: Math.round(2150 + this.currentPallor * 980),
      pallor_index: Number(Math.min(1, Math.max(0, this.currentPallor)).toFixed(3)),
      accel_x: Number((highMotion ? Math.sin(t * 3.1) * 0.68 : 0.015 + Math.sin(t) * 0.01).toFixed(3)),
      accel_y: Number((highMotion ? Math.cos(t * 2.7) * 0.54 : -0.032 + Math.cos(t) * 0.01).toFixed(3)),
      accel_z: Number((highMotion ? 0.85 + Math.sin(t * 4.0) * 0.42 : 0.988).toFixed(3)),
      motion_score: motionScore,
      high_motion_flag: highMotion,
      hand_elevation_deg: highMotion ? 24.5 : -14.0,
      ambient_temp: Number(this.currentAmbientTemp.toFixed(1)),
      ambient_humidity: Number((45.2 + Math.sin(t * 0.1) * 1.4).toFixed(1)),
      hw_event_btn: btnState,
      rtc_time: now.toISOString(),
      battery_pct: Math.max(15, 92 - Math.floor(t / 120)),
      sd_free_mb: Number((3418.4 - t * 0.02).toFixed(1)),
      ml_class: mlClass,
      ml_confidence: Number((mlConf + Math.sin(t * 0.4) * 0.015).toFixed(3)),
    };
  }
}

// ============================================================================
// WEB BLUETOOTH & WEB SERIAL HARDWARE BRIDGE CLIENT
// ============================================================================

export function getHardwareCapabilities(): {
  bleSupported: boolean;
  serialSupported: boolean;
} {
  if (typeof navigator === 'undefined') {
    return { bleSupported: false, serialSupported: false };
  }
  const nav = navigator as unknown as {
    bluetooth?: { requestDevice?: unknown };
    serial?: { requestPort?: unknown };
  };
  return {
    bleSupported: Boolean(nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function'),
    serialSupported: Boolean(nav.serial && typeof nav.serial.requestPort === 'function'),
  };
}

export class HardwareBridge {
  private bleDevice: BleDeviceLike | null = null;
  private bleServer: BleServerLike | null = null;
  private bleTxChar: BleCharacteristicLike | null = null;
  private serialPort: SerialPortLike | null = null;
  private serialReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private lineBuffer = '';
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  public async connectBle(
    onPacket: (packet: TelemetryPacket) => void,
    onDisconnect: (reason: string) => void
  ): Promise<{ deviceName: string; deviceId: string }> {
    const nav = navigator as unknown as {
      bluetooth?: {
        requestDevice: (opts: {
          filters?: Array<{ services?: string[]; namePrefix?: string }>;
          optionalServices?: string[];
        }) => Promise<BleDeviceLike>;
      };
    };

    if (!nav.bluetooth?.requestDevice) {
      throw new Error(
        'Web Bluetooth API is unavailable in this browser context. Use Chrome/Edge over HTTPS or Simulator Mode.'
      );
    }

    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: [SERVICE_UUID] }, { namePrefix: 'VasoSense' }, { namePrefix: 'FRDM' }],
      optionalServices: [SERVICE_UUID],
    });

    if (!device.gatt) {
      throw new Error('Selected BLE peripheral does not expose a GATT server.');
    }

    this.bleDevice = device;
    device.addEventListener('gattserverdisconnected', () => {
      onDisconnect('BLE GATT peripheral disconnected');
    });

    const server = await device.gatt.connect();
    this.bleServer = server;
    const service = await server.getPrimaryService(SERVICE_UUID);
    this.bleTxChar = await service.getCharacteristic(TX_CHAR_UUID);
    const rxChar = await service.getCharacteristic(RX_CHAR_UUID);

    await rxChar.startNotifications();
    rxChar.addEventListener('characteristicvaluechanged', (ev: Event) => {
      const target = ev.target as unknown as BleCharacteristicLike;
      if (!target?.value) return;
      const chunk = this.decoder.decode(target.value);
      this.ingestChunk(chunk, onPacket);
    });

    return {
      deviceName: device.name || 'VasoSense-MCXN236',
      deviceId: device.id,
    };
  }

  public async connectSerial(
    onPacket: (packet: TelemetryPacket) => void,
    onDisconnect: (reason: string) => void
  ): Promise<{ portLabel: string }> {
    const nav = navigator as unknown as {
      serial?: {
        requestPort: (opts?: { filters?: Array<{ usbVendorId?: number }> }) => Promise<SerialPortLike>;
      };
    };

    if (!nav.serial?.requestPort) {
      throw new Error(
        'Web Serial API is unavailable in this browser context. Use Chromium over HTTPS or Simulator Mode.'
      );
    }

    // Request NXP MCU-Link or generic CDC-ACM USB-UART port
    const port = await nav.serial.requestPort();
    await port.open({ baudRate: BAUD_RATE });
    this.serialPort = port;

    if (port.readable) {
      const reader = port.readable.getReader();
      this.serialReader = reader;
      void (async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const chunk = this.decoder.decode(value, { stream: true });
              this.ingestChunk(chunk, onPacket);
            }
          }
        } catch (err) {
          onDisconnect(err instanceof Error ? err.message : 'USB-UART serial stream closed');
        }
      })();
    }

    return { portLabel: `USB-UART (${BAUD_RATE} baud)` };
  }

  private ingestChunk(chunk: string, onPacket: (packet: TelemetryPacket) => void): void {
    this.lineBuffer += chunk;
    const lines = this.lineBuffer.split(/\r?\n/);
    this.lineBuffer = lines.pop() ?? '';
    for (const line of lines) {
      const packet = parseTelemetryLine(line);
      if (packet) {
        onPacket(packet);
      }
    }
  }

  public async sendTxCommand(commandText: string): Promise<boolean> {
    const bytes = this.encoder.encode(commandText);
    if (this.bleTxChar && this.bleServer?.connected) {
      await this.bleTxChar.writeValue(bytes);
      return true;
    }
    if (this.serialPort?.writable) {
      const writer = this.serialPort.writable.getWriter();
      try {
        await writer.write(bytes);
        return true;
      } finally {
        writer.releaseLock();
      }
    }
    return false;
  }

  public async syncRtcTime(date: Date = new Date()): Promise<{ sentOverHardware: boolean; command: string }> {
    const command = buildRtcSyncCommand(date);
    const sent = await this.sendTxCommand(command);
    return { sentOverHardware: sent, command };
  }

  public async disconnect(): Promise<void> {
    if (this.bleServer?.connected) {
      this.bleServer.disconnect();
    }
    this.bleServer = null;
    this.bleTxChar = null;
    this.bleDevice = null;

    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {
        // Ignore reader cancel error on teardown
      }
      this.serialReader = null;
    }
    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {
        // Ignore port close error on teardown
      }
      this.serialPort = null;
    }
    this.lineBuffer = '';
  }
}
