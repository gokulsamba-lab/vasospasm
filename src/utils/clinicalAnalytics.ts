import type {
  CalibrationBaseline,
  EpisodeTrigger,
  OfflineRecord,
  SymptomLog,
  TelemetryPacket,
  VasospasmEpisode,
} from '../types/telemetry';
import { CSV_TELEMETRY_COLUMNS } from '../services/hardwareBridge';

export interface EpisodeSummaryMetrics {
  episodesLast7d: number;
  episodesLast30d: number;
  avgDurationMin: number;
  avgRecoveryTimeMin: number;
  hwConfirmedCount: number;
  coldTriggeredPct: number;
}

/**
 * Computes clinical episode summary metrics for a reference timestamp.
 */
export function computeEpisodeSummary(
  episodes: VasospasmEpisode[],
  referenceNow: Date = new Date()
): EpisodeSummaryMetrics {
  const nowMs = referenceNow.getTime();
  const ms7d = 7 * 24 * 60 * 60 * 1000;
  const ms30d = 30 * 24 * 60 * 60 * 1000;

  let last7d = 0;
  let last30d = 0;
  let totalDur = 0;
  let totalRecovery = 0;
  let hwConfirmed = 0;
  let coldCount = 0;

  for (const ep of episodes) {
    const startMs = new Date(ep.startedAt).getTime();
    const age = nowMs - startMs;
    if (age <= ms7d) last7d += 1;
    if (age <= ms30d) last30d += 1;
    totalDur += ep.durationMin;
    totalRecovery += ep.recoveryTimeMin;
    if (ep.hwButtonConfirmed) hwConfirmed += 1;
    if (ep.trigger === 'Cold Exposure') coldCount += 1;
  }

  const count = episodes.length;
  return {
    episodesLast7d: last7d,
    episodesLast30d: last30d,
    avgDurationMin: count > 0 ? Number((totalDur / count).toFixed(1)) : 0,
    avgRecoveryTimeMin: count > 0 ? Number((totalRecovery / count).toFixed(1)) : 0,
    hwConfirmedCount: hwConfirmed,
    coldTriggeredPct: count > 0 ? Math.round((coldCount / count) * 100) : 0,
  };
}

/**
 * Computes thermal rewarming recovery time (minutes from thermal nadir until
 * fingertip temperature recovers to within 1.0°C of dorsal hand baseline).
 */
export function calculateRewarmingRecoveryMinutes(
  samples: Array<{ minuteOffset: number; delta_t: number }>
): number {
  if (samples.length === 0) return 0;

  let nadirIdx = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i].delta_t < samples[nadirIdx].delta_t) {
      nadirIdx = i;
    }
  }

  const nadirTime = samples[nadirIdx].minuteOffset;
  for (let i = nadirIdx + 1; i < samples.length; i += 1) {
    if (samples[i].delta_t >= -1.0) {
      return Number(Math.max(0, samples[i].minuteOffset - nadirTime).toFixed(1));
    }
  }

  const last = samples[samples.length - 1];
  return Number(Math.max(0, last.minuteOffset - nadirTime).toFixed(1));
}

/**
 * Filters episodes by trigger category and free-text query across notes/stage/id.
 */
export function filterEpisodes(
  episodes: VasospasmEpisode[],
  triggerFilter: EpisodeTrigger | 'All',
  searchQuery: string
): VasospasmEpisode[] {
  const q = searchQuery.trim().toLowerCase();
  return episodes.filter((ep) => {
    if (triggerFilter !== 'All' && ep.trigger !== triggerFilter) {
      return false;
    }
    if (!q) return true;
    return (
      ep.id.toLowerCase().includes(q) ||
      ep.trigger.toLowerCase().includes(q) ||
      ep.stage.toLowerCase().includes(q) ||
      ep.notes.toLowerCase().includes(q)
    );
  });
}

/**
 * Computes a personalized resting calibration baseline from captured packets
 * (excluding high-motion artifact packets when valid packets exist).
 */
export function computeCalibrationBaseline(
  packets: TelemetryPacket[],
  timestamp: Date = new Date()
): CalibrationBaseline {
  const valid = packets.filter((p) => !p.high_motion_flag);
  const pool = valid.length > 0 ? valid : packets;

  if (pool.length === 0) {
    return {
      restingPiPct: 2.8,
      restingDeltaTC: -0.7,
      restingFingertipTempC: 32.4,
      baselineRgb: { r: 214, g: 164, b: 150 },
      calibratedAt: timestamp.toISOString(),
    };
  }

  const n = pool.length;
  const sum = pool.reduce(
    (acc, p) => ({
      pi: acc.pi + p.perfusion_index,
      dt: acc.dt + p.delta_t,
      tf: acc.tf + p.t_fingertip,
      r: acc.r + p.rgb_r,
      g: acc.g + p.rgb_g,
      b: acc.b + p.rgb_b,
    }),
    { pi: 0, dt: 0, tf: 0, r: 0, g: 0, b: 0 }
  );

  return {
    restingPiPct: Number((sum.pi / n).toFixed(2)),
    restingDeltaTC: Number((sum.dt / n).toFixed(2)),
    restingFingertipTempC: Number((sum.tf / n).toFixed(2)),
    baselineRgb: {
      r: Math.round(sum.r / n),
      g: Math.round(sum.g / n),
      b: Math.round(sum.b / n),
    },
    calibratedAt: timestamp.toISOString(),
  };
}

/**
 * Serializes offline SD / SPI flash telemetry records into CSV format
 * for ML training and clinical validation.
 */
export function serializeRecordsToCsv(records: OfflineRecord[]): string {
  const header = ['seq', 'crc_valid', ...CSV_TELEMETRY_COLUMNS].join(',');
  const rows = records.map(({ seq, crcValid, packet }) => {
    const values = CSV_TELEMETRY_COLUMNS.map((col) => {
      const val = packet[col];
      if (typeof val === 'boolean') return val ? '1' : '0';
      return String(val);
    });
    return [String(seq), crcValid ? '1' : '0', ...values].join(',');
  });
  return [header, ...rows].join('\n');
}

/**
 * Computes correlation stats between patient-marked symptom events
 * and objective microvascular perfusion drops (PI < threshold or DeltaT <= -3.0°C).
 */
export function computeSymptomPerfusionCorrelation(
  logs: SymptomLog[],
  piThresholdPct = 1.0
): {
  totalMarked: number;
  objectiveDropConfirmed: number;
  concordancePct: number;
  meanPiAtSymptom: number;
  meanDeltaTAtSymptom: number;
} {
  const total = logs.length;
  if (total === 0) {
    return {
      totalMarked: 0,
      objectiveDropConfirmed: 0,
      concordancePct: 0,
      meanPiAtSymptom: 0,
      meanDeltaTAtSymptom: 0,
    };
  }

  let confirmed = 0;
  let sumPi = 0;
  let sumDt = 0;
  for (const log of logs) {
    sumPi += log.piAtEvent;
    sumDt += log.deltaTAtEvent;
    if (log.piAtEvent < piThresholdPct || log.deltaTAtEvent <= -3.0) {
      confirmed += 1;
    }
  }

  return {
    totalMarked: total,
    objectiveDropConfirmed: confirmed,
    concordancePct: Math.round((confirmed / total) * 100),
    meanPiAtSymptom: Number((sumPi / total).toFixed(2)),
    meanDeltaTAtSymptom: Number((sumDt / total).toFixed(2)),
  };
}
