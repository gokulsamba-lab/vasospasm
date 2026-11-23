export type MlVasospasmClass = 0 | 1 | 2;

export interface TelemetryPacket {
  // MAX30102 Reflective PPG (Strictly excludes SpO2)
  ppg_ac: number;
  ppg_dc: number;
  perfusion_index: number; // Percentage (%)
  ppg_snr: number; // dB

  // Dual TMP117 Thermal Gradient Sensors
  t_fingertip: number; // °C (TMP117 #1 - Side of finger pad)
  t_dorsal: number; // °C (TMP117 #2 - Dorsal hand reference)
  delta_t: number; // °C (t_fingertip - t_dorsal)
  cooling_rate: number; // °C/min (dT/dt)

  // TCS34725 Spectral Reflectance (Time-multiplexed white LED)
  rgb_r: number; // 0-255 calibrated
  rgb_g: number; // 0-255 calibrated
  rgb_b: number; // 0-255 calibrated
  rgb_clear: number; // Raw clear channel counts
  pallor_index: number; // 0.0 - 1.0 (higher = stronger pallor/cyanosis shift)

  // LIS3DH 3-Axis Accelerometer & Motion Gate
  accel_x: number; // g
  accel_y: number; // g
  accel_z: number; // g
  motion_score: number; // Variance score (0 - 1.0+)
  high_motion_flag: boolean; // True when motion artifact invalidates window
  hand_elevation_deg: number; // Degrees relative to heart level (-90 to +90)

  // Environmental Sensor
  ambient_temp: number; // °C
  ambient_humidity: number; // %RH

  // Hardware & System Telemetry
  hw_event_btn: boolean;
  rtc_time: string; // ISO-8601 timestamp from MCU RTC
  battery_pct: number; // 0-100
  sd_free_mb: number; // MB free on microSD / SPI flash

  // Cortex-M33 Edge Inference Output
  ml_class: MlVasospasmClass; // 0 = Normal, 1 = Pre-Vasospasm / Cooling, 2 = Active Vasospasm
  ml_confidence: number; // 0.0 - 1.0 (or 0-100 normalized to 0-100 in UI)
}

export type DataSourceMode = 'simulator' | 'ble' | 'serial';

export type SimulatorScenario =
  | 'normal'
  | 'cooling'
  | 'vasospasm'
  | 'motion_artifact';

export type AppView =
  | 'dashboard'
  | 'history'
  | 'sync'
  | 'diagnostics'
  | 'report'
  | 'ai'
  | 'account';

export type RaynaudsType = 'Primary' | 'Secondary (Systemic Sclerosis)' | 'Secondary (Lupus / Mixed CTD)' | 'Unspecified';

export type DominantHand = 'Right' | 'Left' | 'Ambidextrous';

export interface CalibrationBaseline {
  restingPiPct: number;
  restingDeltaTC: number;
  restingFingertipTempC: number;
  baselineRgb: { r: number; g: number; b: number };
  calibratedAt: string;
}

export interface PatientProfile {
  patientId: string;
  fullName: string;
  email: string;
  dominantHand: DominantHand;
  monitoredHand: 'Left' | 'Right';
  raynaudsType: RaynaudsType;
  baselineFingertipTempC: number;
  piAlertThresholdPct: number;
  deltaTAlertThresholdC: number;
  boundDeviceName: string;
  boundDeviceMacOrSerial: string;
  rtcLastSyncedAt: string | null;
  calibration: CalibrationBaseline;
}

export type EpisodeTrigger = 'Cold Exposure' | 'Emotional Stress' | 'Vibration / Tool Use' | 'Unknown';
export type RaynaudsStage = 'White (Pallor)' | 'Blue (Cyanosis)' | 'Red (Rewarming)' | 'Mixed Triphasic';

export interface EpisodeSamplePoint {
  minuteOffset: number;
  timestamp: string;
  perfusion_index: number;
  delta_t: number;
  t_fingertip: number;
  t_dorsal: number;
  pallor_index: number;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  ml_class: MlVasospasmClass;
}

export interface VasospasmEpisode {
  id: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  recoveryTimeMin: number; // Minutes to recover within 1.0°C of dorsal baseline
  nadirPiPct: number;
  nadirDeltaTC: number;
  nadirFingertipTempC: number;
  peakPallorIndex: number;
  trigger: EpisodeTrigger;
  stage: RaynaudsStage;
  severity: 1 | 2 | 3 | 4 | 5;
  hwButtonConfirmed: boolean;
  notes: string;
  samples: EpisodeSamplePoint[];
}

export interface SymptomLog {
  id: string;
  timestamp: string;
  source: 'hw_button' | 'manual_entry';
  trigger: EpisodeTrigger;
  stage: RaynaudsStage;
  severity: 1 | 2 | 3 | 4 | 5;
  piAtEvent: number;
  deltaTAtEvent: number;
  notes: string;
  annotated: boolean;
}

export interface OfflineRecord {
  seq: number;
  crcValid: boolean;
  packet: TelemetryPacket;
}

export interface HardwareConnectionState {
  mode: DataSourceMode;
  connected: boolean;
  deviceLabel: string;
  transportDetail: string;
  errorMessage: string | null;
}
