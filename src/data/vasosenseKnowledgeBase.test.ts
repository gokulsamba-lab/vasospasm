import assert from 'node:assert/strict';
import test from 'node:test';
import {
  QUICK_ASK_CATEGORIES,
  VASOSENSE_FAQ_ITEMS,
  VASOSENSE_FAQ_SECTIONS,
  VASOSENSE_KNOWLEDGE_BASE,
  buildVasoSenseSystemInstruction,
  formatLiveTelemetryContext,
} from './vasosenseKnowledgeBase.ts';

test('embeds all 5 sections (A-E) and all 40 Q&As (Q1-Q40)', () => {
  assert.equal(VASOSENSE_FAQ_SECTIONS.length, 5);
  assert.deepEqual(
    VASOSENSE_FAQ_SECTIONS.map((s) => s.id),
    ['A', 'B', 'C', 'D', 'E']
  );
  assert.deepEqual(
    VASOSENSE_FAQ_SECTIONS.map((s) => s.items.length),
    [12, 10, 7, 3, 8]
  );
  assert.equal(VASOSENSE_FAQ_ITEMS.length, 40);

  for (let i = 1; i <= 40; i += 1) {
    const item = VASOSENSE_FAQ_ITEMS[i - 1];
    assert.equal(item.number, i);
    assert.equal(item.id, `Q${i}`);
    assert.ok(item.question.length > 5, `Q${i} question missing`);
    assert.ok(item.answer.length > 20, `Q${i} answer missing`);
    assert.ok(!item.answer.includes('$'), `Q${i} contains unformatted LaTeX delimiters`);
    assert.ok(
      VASOSENSE_KNOWLEDGE_BASE.includes(`**Q${i}:`),
      `VASOSENSE_KNOWLEDGE_BASE missing Q${i}`
    );
  }
});

test('includes all 3 Quick-Ask categories for Live Readings, Theory, and Hardware', () => {
  assert.equal(QUICK_ASK_CATEGORIES.length, 3);
  assert.deepEqual(
    QUICK_ASK_CATEGORIES.map((c) => c.id),
    ['live', 'theory', 'hardware']
  );
});

test('formats live telemetry context and injects complete 40-Q&A grounding into systemInstruction', () => {
  const formatted = formatLiveTelemetryContext({
    perfusion_index: 0.42,
    ppg_ac: 51.2,
    ppg_dc: 12190,
    ppg_snr: 18.4,
    t_fingertip: 24.1,
    t_dorsal: 32.8,
    delta_t: -8.7,
    cooling_rate: -1.45,
    pallor_index: 0.78,
    motion_score: 0.032,
    high_motion_flag: false,
    hand_elevation_deg: -10,
    ml_class: 2,
    ml_confidence: 0.94,
    recentEpisodeCount: 6,
    monitoredHand: 'Left',
    raynaudsType: 'Secondary (Systemic Sclerosis)',
  });

  assert.match(formatted, /0\.42%/);
  assert.match(formatted, /-8\.70 °C/);
  assert.match(formatted, /78%/);
  assert.match(formatted, /Class 2/);

  const instruction = buildVasoSenseSystemInstruction({
    perfusion_index: 0.42,
    ppg_ac: 51.2,
    ppg_dc: 12190,
    ppg_snr: 18.4,
    t_fingertip: 24.1,
    t_dorsal: 32.8,
    delta_t: -8.7,
    cooling_rate: -1.45,
    pallor_index: 0.78,
    motion_score: 0.032,
    high_motion_flag: false,
    hand_elevation_deg: -10,
    ml_class: 2,
    ml_confidence: 0.94,
    recentEpisodeCount: 6,
  });

  assert.match(instruction, /SECTION A: Raynaud's Phenomenon/);
  assert.match(instruction, /SECTION B: Understanding Your Live Sensor Metrics/);
  assert.match(instruction, /SECTION C: Hardware & Engineering Architecture/);
  assert.match(instruction, /SECTION D: AI Model, Signal Processing & Public Datasets/);
  assert.match(instruction, /SECTION E: Device Usage, Troubleshooting & Offline Sync/);
  assert.match(instruction, /PhysioNet Pulse Transit Time/);
  assert.match(instruction, /BUT PPG Database/);
  assert.match(instruction, /QoL_Stress Dataset/);
  assert.match(instruction, /FRDM-MCXN236/);
  assert.match(instruction, /MAX30102/);
  assert.match(instruction, /TMP117/);
  assert.match(instruction, /TCS34725/);
  assert.match(instruction, /LIS3DH/);
  assert.match(instruction, /SpO2/);
  assert.match(instruction, /rheumatologist/i);
});
