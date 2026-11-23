import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRewarmingRecoveryMinutes,
  computeCalibrationBaseline,
  computeEpisodeSummary,
  computeSymptomPerfusionCorrelation,
  filterEpisodes,
  serializeRecordsToCsv,
} from './clinicalAnalytics';
import {
  createSeedEpisodes,
  createSeedSymptomLogs,
  generateSeedOfflineRecords,
} from '../data/seedData';

test('calculates thermal rewarming recovery time from nadir to within 1.0°C of dorsal baseline', () => {
  const samples = [
    { minuteOffset: 0, delta_t: -0.8 },
    { minuteOffset: 3, delta_t: -5.2 },
    { minuteOffset: 6, delta_t: -9.5 }, // nadir at min 6
    { minuteOffset: 9, delta_t: -4.1 },
    { minuteOffset: 12, delta_t: -1.4 },
    { minuteOffset: 14, delta_t: -0.9 }, // recovered within 1.0°C at min 14
    { minuteOffset: 16, delta_t: -0.6 },
  ];
  assert.equal(calculateRewarmingRecoveryMinutes(samples), 8);
});

test('computes episode summary metrics across 7d and 30d windows', () => {
  const now = new Date('2026-11-21T21:00:00.000Z');
  const episodes = createSeedEpisodes(now);
  const summary = computeEpisodeSummary(episodes, now);

  assert.equal(summary.episodesLast7d, 4);
  assert.equal(summary.episodesLast30d, 6);
  assert.ok(summary.avgDurationMin > 10);
  assert.ok(summary.avgRecoveryTimeMin > 5);
  assert.equal(summary.hwConfirmedCount, 5);
});

test('filters episodes by trigger and search query', () => {
  const now = new Date('2026-11-21T21:00:00.000Z');
  const episodes = createSeedEpisodes(now);

  const stressOnly = filterEpisodes(episodes, 'Emotional Stress', '');
  assert.equal(stressOnly.length, 1);
  assert.equal(stressOnly[0].id, 'EP-2026-107');

  const mixerSearch = filterEpisodes(episodes, 'All', 'mixer');
  assert.equal(mixerSearch.length, 1);
  assert.equal(mixerSearch[0].trigger, 'Vibration / Tool Use');
});

test('calibration baseline ignores high-motion artifact packets when valid packets exist', () => {
  const baseRecords = generateSeedOfflineRecords(5).map((r) => r.packet);
  baseRecords[0] = { ...baseRecords[0], perfusion_index: 2.5, high_motion_flag: false };
  baseRecords[1] = { ...baseRecords[1], perfusion_index: 2.9, high_motion_flag: false };
  baseRecords[2] = { ...baseRecords[2], perfusion_index: 0.1, high_motion_flag: true };

  const cal = computeCalibrationBaseline(baseRecords.slice(0, 3));
  assert.equal(cal.restingPiPct, 2.7);
});

test('serializes offline records to CSV with seq, crc_valid, and 27 telemetry columns', () => {
  const records = generateSeedOfflineRecords(3);
  const csv = serializeRecordsToCsv(records);
  const lines = csv.split('\n');
  assert.equal(lines.length, 4);
  assert.ok(lines[0].startsWith('seq,crc_valid,rtc_time,ppg_ac,ppg_dc,perfusion_index'));
  assert.equal(lines[0].includes('spo2'), false);
});

test('computes patient symptom to objective perfusion drop correlation', () => {
  const logs = createSeedSymptomLogs();
  const corr = computeSymptomPerfusionCorrelation(logs, 1.0);
  assert.equal(corr.totalMarked, 3);
  assert.equal(corr.objectiveDropConfirmed, 3);
  assert.equal(corr.concordancePct, 100);
});
