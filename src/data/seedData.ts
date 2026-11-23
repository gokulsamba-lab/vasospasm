import type {
  EpisodeSamplePoint,
  OfflineRecord,
  PatientProfile,
  SymptomLog,
  VasospasmEpisode,
} from '../types/telemetry';
import { calculateRewarmingRecoveryMinutes } from '../utils/clinicalAnalytics';

export const DEFAULT_DEMO_PROFILE: PatientProfile = {
  patientId: 'PT-MCX-4082',
  fullName: 'Elena Rostova',
  email: 'elena.rostova@clinical-demo.org',
  dominantHand: 'Right',
  monitoredHand: 'Left',
  raynaudsType: 'Secondary (Systemic Sclerosis)',
  baselineFingertipTempC: 32.4,
  piAlertThresholdPct: 0.9,
  deltaTAlertThresholdC: -3.5,
  boundDeviceName: 'VasoSense-MCXN236',
  boundDeviceMacOrSerial: 'MCXN236-E8:9F:6D:41:2B:09',
  rtcLastSyncedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  calibration: {
    restingPiPct: 2.84,
    restingDeltaTC: -0.68,
    restingFingertipTempC: 32.4,
    baselineRgb: { r: 214, g: 164, b: 150 },
    calibratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

function buildEpisodeCurve(
  startIso: string,
  nadirPi: number,
  nadirDeltaT: number,
  totalMinutes: number
): EpisodeSamplePoint[] {
  const startMs = new Date(startIso).getTime();
  const points: EpisodeSamplePoint[] = [];
  const steps = Math.max(8, Math.round(totalMinutes));
  const nadirStep = Math.round(steps * 0.35);

  for (let i = 0; i <= steps; i += 1) {
    const frac = i / steps;
    let severity = 0;
    if (i <= nadirStep) {
      severity = Math.sin((i / nadirStep) * (Math.PI / 2));
    } else {
      const recFrac = (i - nadirStep) / (steps - nadirStep);
      severity = Math.cos(recFrac * (Math.PI / 2));
    }

    const pi = Number((2.8 - (2.8 - nadirPi) * severity).toFixed(2));
    const deltaT = Number((-0.7 + (nadirDeltaT + 0.7) * severity).toFixed(2));
    const tDorsal = Number((33.1 - severity * 0.7).toFixed(2));
    const tFingertip = Number((tDorsal + deltaT).toFixed(2));
    const pallor = Number((0.14 + severity * 0.72).toFixed(3));
    const rgbR = Math.round(215 - severity * 26);
    const rgbG = Math.round(164 + severity * 34);
    const rgbB = Math.round(150 + severity * 58);

    const mlClass = severity > 0.62 ? 2 : severity > 0.28 ? 1 : 0;

    points.push({
      minuteOffset: Number((frac * totalMinutes).toFixed(1)),
      timestamp: new Date(startMs + frac * totalMinutes * 60000).toISOString(),
      perfusion_index: pi,
      delta_t: deltaT,
      t_fingertip: tFingertip,
      t_dorsal: tDorsal,
      pallor_index: pallor,
      rgb_r: rgbR,
      rgb_g: rgbG,
      rgb_b: rgbB,
      ml_class: mlClass,
    });
  }

  return points;
}

export function createSeedEpisodes(now: Date = new Date()): VasospasmEpisode[] {
  const nowMs = now.getTime();
  const day = 24 * 60 * 60 * 1000;

  const specs: Array<{
    id: string;
    daysAgo: number;
    durationMin: number;
    nadirPi: number;
    nadirDeltaT: number;
    trigger: VasospasmEpisode['trigger'];
    stage: VasospasmEpisode['stage'];
    severity: VasospasmEpisode['severity'];
    hwBtn: boolean;
    notes: string;
  }> = [
    {
      id: 'EP-2026-109',
      daysAgo: 0.4,
      durationMin: 18,
      nadirPi: 0.24,
      nadirDeltaT: -10.8,
      trigger: 'Cold Exposure',
      stage: 'Mixed Triphasic',
      severity: 4,
      hwBtn: true,
      notes: 'Morning walk at 9°C without thermal gloves; rapid blanching followed by cyanosis on index/middle digits.',
    },
    {
      id: 'EP-2026-108',
      daysAgo: 1.8,
      durationMin: 14,
      nadirPi: 0.36,
      nadirDeltaT: -8.6,
      trigger: 'Cold Exposure',
      stage: 'Blue (Cyanosis)',
      severity: 3,
      hwBtn: true,
      notes: 'Refrigerated grocery aisle exposure; rewarmed under warm water.',
    },
    {
      id: 'EP-2026-107',
      daysAgo: 3.1,
      durationMin: 11,
      nadirPi: 0.52,
      nadirDeltaT: -6.2,
      trigger: 'Emotional Stress',
      stage: 'White (Pallor)',
      severity: 3,
      hwBtn: false,
      notes: 'Sympathetic vasoconstriction during clinical intake interview; ambient room 21.5°C.',
    },
    {
      id: 'EP-2026-106',
      daysAgo: 5.4,
      durationMin: 22,
      nadirPi: 0.19,
      nadirDeltaT: -11.4,
      trigger: 'Cold Exposure',
      stage: 'Mixed Triphasic',
      severity: 5,
      hwBtn: true,
      notes: 'Prolonged outdoor transit; delayed thermal rewarming phase with reactive hyperemia.',
    },
    {
      id: 'EP-2026-105',
      daysAgo: 9.2,
      durationMin: 13,
      nadirPi: 0.44,
      nadirDeltaT: -7.1,
      trigger: 'Vibration / Tool Use',
      stage: 'White (Pallor)',
      severity: 2,
      hwBtn: true,
      notes: 'Handheld rotary kitchen mixer operation (~5 min) triggered localized digital pallor.',
    },
    {
      id: 'EP-2026-104',
      daysAgo: 13.6,
      durationMin: 16,
      nadirPi: 0.31,
      nadirDeltaT: -9.3,
      trigger: 'Cold Exposure',
      stage: 'Blue (Cyanosis)',
      severity: 4,
      hwBtn: true,
      notes: 'Air-conditioned conference suite at 17°C; verified via physical event marker button.',
    },
  ];

  return specs.map((s) => {
    const startMs = nowMs - s.daysAgo * day;
    const startIso = new Date(startMs).toISOString();
    const endIso = new Date(startMs + s.durationMin * 60000).toISOString();
    const samples = buildEpisodeCurve(startIso, s.nadirPi, s.nadirDeltaT, s.durationMin);
    const recoveryMin = calculateRewarmingRecoveryMinutes(samples);
    const nadirSample = samples.reduce((min, cur) =>
      cur.perfusion_index < min.perfusion_index ? cur : min
    );

    return {
      id: s.id,
      startedAt: startIso,
      endedAt: endIso,
      durationMin: s.durationMin,
      recoveryTimeMin: recoveryMin,
      nadirPiPct: s.nadirPi,
      nadirDeltaTC: s.nadirDeltaT,
      nadirFingertipTempC: nadirSample.t_fingertip,
      peakPallorIndex: Number(Math.max(...samples.map((p) => p.pallor_index)).toFixed(3)),
      trigger: s.trigger,
      stage: s.stage,
      severity: s.severity,
      hwButtonConfirmed: s.hwBtn,
      notes: s.notes,
      samples,
    };
  });
}

export function createSeedSymptomLogs(now: Date = new Date()): SymptomLog[] {
  const nowMs = now.getTime();
  const hr = 60 * 60 * 1000;
  return [
    {
      id: 'SYM-904',
      timestamp: new Date(nowMs - 9.5 * hr).toISOString(),
      source: 'hw_button',
      trigger: 'Cold Exposure',
      stage: 'Mixed Triphasic',
      severity: 4,
      piAtEvent: 0.28,
      deltaTAtEvent: -10.1,
      notes: 'Hardware button pressed during outdoor morning transit; tingling & sharp demarcation at DIP joint.',
      annotated: true,
    },
    {
      id: 'SYM-903',
      timestamp: new Date(nowMs - 43 * hr).toISOString(),
      source: 'hw_button',
      trigger: 'Cold Exposure',
      stage: 'Blue (Cyanosis)',
      severity: 3,
      piAtEvent: 0.39,
      deltaTAtEvent: -8.4,
      notes: 'Chilled room exposure; recovered within 10 min after hand warming.',
      annotated: true,
    },
    {
      id: 'SYM-902',
      timestamp: new Date(nowMs - 74 * hr).toISOString(),
      source: 'manual_entry',
      trigger: 'Emotional Stress',
      stage: 'White (Pallor)',
      severity: 3,
      piAtEvent: 0.55,
      deltaTAtEvent: -5.9,
      notes: 'Brief pallor phase without cyanosis.',
      annotated: true,
    },
  ];
}

export function generateSeedOfflineRecords(count = 48, baseTime: Date = new Date()): OfflineRecord[] {
  const baseMs = baseTime.getTime() - count * 10000;
  const records: OfflineRecord[] = [];
  for (let i = 0; i < count; i += 1) {
    const phase = i / count;
    const isEpisode = phase > 0.25 && phase < 0.72;
    const intensity = isEpisode ? Math.sin(((phase - 0.25) / 0.47) * Math.PI) : 0;

    const pi = Number((2.8 - intensity * 2.45).toFixed(2));
    const tDorsal = Number((33.1 - intensity * 0.5).toFixed(2));
    const deltaT = Number((-0.7 - intensity * 8.9).toFixed(2));
    const tFingertip = Number((tDorsal + deltaT).toFixed(2));
    const pallor = Number((0.14 + intensity * 0.71).toFixed(3));
    const dc = 12380;
    const ac = Number(((pi / 100) * dc).toFixed(2));

    records.push({
      seq: 10420 + i,
      crcValid: true,
      packet: {
        ppg_ac: ac,
        ppg_dc: dc,
        perfusion_index: pi,
        ppg_snr: Number((24.1 - intensity * 6.2).toFixed(1)),
        t_fingertip: tFingertip,
        t_dorsal: tDorsal,
        delta_t: deltaT,
        cooling_rate: Number((-intensity * 1.4).toFixed(2)),
        rgb_r: Math.round(215 - intensity * 25),
        rgb_g: Math.round(164 + intensity * 33),
        rgb_b: Math.round(150 + intensity * 58),
        rgb_clear: Math.round(2180 + intensity * 920),
        pallor_index: pallor,
        accel_x: 0.018,
        accel_y: -0.029,
        accel_z: 0.991,
        motion_score: 0.041,
        high_motion_flag: false,
        hand_elevation_deg: -11.5,
        ambient_temp: Number((22.4 - intensity * 8.6).toFixed(1)),
        ambient_humidity: 46.5,
        hw_event_btn: i === 16,
        rtc_time: new Date(baseMs + i * 10000).toISOString(),
        battery_pct: 89,
        sd_free_mb: Number((3420.5 - i * 0.02).toFixed(1)),
        ml_class: intensity > 0.6 ? 2 : intensity > 0.25 ? 1 : 0,
        ml_confidence: Number((0.95 - intensity * 0.04).toFixed(3)),
      },
    });
  }
  return records;
}
