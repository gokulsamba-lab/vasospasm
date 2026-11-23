import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BAUD_RATE,
  RX_CHAR_UUID,
  SERVICE_UUID,
  TX_CHAR_UUID,
  TelemetrySimulator,
  buildRtcSyncCommand,
  parseTelemetryLine,
} from './hardwareBridge';

test('exposes documented FRDM-MCXN236 BLE UUIDs and 115200 baud constant', () => {
  assert.equal(BAUD_RATE, 115200);
  assert.match(SERVICE_UUID, /^[0-9a-f-]{36}$/);
  assert.match(TX_CHAR_UUID, /^[0-9a-f-]{36}$/);
  assert.match(RX_CHAR_UUID, /^[0-9a-f-]{36}$/);
});

test('parses valid JSON telemetry packet and computes delta_t and perfusion_index when omitted', () => {
  const json = JSON.stringify({
    ppg_ac: 240,
    ppg_dc: 12000,
    ppg_snr: 23.4,
    t_fingertip: 24.5,
    t_dorsal: 32.0,
    cooling_rate: -1.6,
    rgb_r: 192,
    rgb_g: 198,
    rgb_b: 210,
    rgb_clear: 2950,
    pallor_index: 0.74,
    accel_x: 0.01,
    accel_y: -0.02,
    accel_z: 0.99,
    motion_score: 0.03,
    high_motion_flag: false,
    hand_elevation_deg: -10,
    ambient_temp: 14.5,
    ambient_humidity: 44.0,
    hw_event_btn: true,
    rtc_time: '2026-11-21T20:00:00.000Z',
    battery_pct: 84,
    sd_free_mb: 3400.2,
    ml_class: 2,
    ml_confidence: 93.5,
  });

  const parsed = parseTelemetryLine(json);
  assert.ok(parsed);
  assert.equal(parsed.perfusion_index, 2.0);
  assert.equal(parsed.delta_t, -7.5);
  assert.equal(parsed.hw_event_btn, true);
  assert.equal(parsed.ml_class, 2);
  assert.equal(parsed.ml_confidence, 0.935);
  assert.equal('spo2' in (parsed as unknown as Record<string, unknown>), false);
});

test('parses valid CSV telemetry frame into TelemetryPacket', () => {
  const csv =
    '2026-11-21T20:05:00.000Z,185,12500,1.48,21.2,27.1,32.5,-5.4,-0.85,201,182,175,2600,0.45,0.02,-0.01,0.98,0.045,0,-12,15.5,48.2,1,91,3410.5,1,0.88';
  const parsed = parseTelemetryLine(csv);
  assert.ok(parsed);
  assert.equal(parsed.rtc_time, '2026-11-21T20:05:00.000Z');
  assert.equal(parsed.perfusion_index, 1.48);
  assert.equal(parsed.delta_t, -5.4);
  assert.equal(parsed.high_motion_flag, false);
  assert.equal(parsed.hw_event_btn, true);
  assert.equal(parsed.ml_class, 1);
  assert.equal(parsed.ml_confidence, 0.88);
});

test('rejects malformed or empty telemetry lines safely', () => {
  assert.equal(parseTelemetryLine(''), null);
  assert.equal(parseTelemetryLine('{bad json'), null);
  assert.equal(parseTelemetryLine('rtc_time,ppg_ac,ppg_dc'), null);
  assert.equal(parseTelemetryLine('{"foo": 123}'), null);
});

test('builds valid RTC sync command frame', () => {
  const dt = new Date('2026-11-21T21:00:00.000Z');
  const cmd = buildRtcSyncCommand(dt);
  const parsed = JSON.parse(cmd.trim()) as { cmd: string; unix: number; iso: string };
  assert.equal(parsed.cmd, 'RTC_SYNC');
  assert.equal(parsed.iso, '2026-11-21T21:00:00.000Z');
  assert.equal(parsed.unix, Math.floor(dt.getTime() / 1000));
});

test('TelemetrySimulator transitions scenarios and fires one-shot hardware button event', () => {
  const sim = new TelemetrySimulator();
  sim.setScenario('vasospasm');
  let last = sim.nextPacket();
  for (let i = 0; i < 15; i += 1) {
    last = sim.nextPacket();
  }
  assert.equal(last.ml_class, 2);
  assert.ok(last.perfusion_index < 1.0);
  assert.ok(last.delta_t < -4.0);

  sim.setScenario('motion_artifact');
  const motionPkt = sim.nextPacket();
  assert.equal(motionPkt.high_motion_flag, true);
  assert.ok(motionPkt.motion_score > 0.5);

  sim.triggerHardwareButton();
  const btnPkt = sim.nextPacket();
  assert.equal(btnPkt.hw_event_btn, true);
  const nextPkt = sim.nextPacket();
  assert.equal(nextPkt.hw_event_btn, false);
});
