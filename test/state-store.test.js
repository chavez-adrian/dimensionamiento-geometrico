require('dotenv').config();
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const StateStore = require('../src/state-store');

describe('StateStore', () => {
  let store;

  before(async () => {
    store = new StateStore(process.env.DATABASE_URL);
    await store.connect();
  });

  after(async () => {
    await store.disconnect();
  });

  it('loadState returns 17 rows for user adrian', async () => {
    const rows = await store.loadState('adrian');
    assert.equal(rows.length, 17);
  });

  it('loadState row has required fields', async () => {
    const rows = await store.loadState('adrian');
    const row = rows[0];
    assert.ok('control' in row);
    assert.ok('nivel' in row);
    assert.ok('attempts' in row);
    assert.ok('correct_streak' in row);
    assert.ok('mastered' in row);
    assert.ok('unlocked' in row);
  });

  it('nivel 1 cells are unlocked for all geometric controls', async () => {
    const rows = await store.loadState('adrian');
    const geoControls = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
    const nivel1 = rows.filter(r => r.nivel === 1 && geoControls.includes(r.control));
    assert.equal(nivel1.length, 5);
    nivel1.forEach(r => assert.equal(r.unlocked, true));
  });

  it('Fundamentos L1 is unlocked and L2 is locked in DB', async () => {
    const rows = await store.loadState('adrian');
    const fundL1 = rows.find(r => r.control === 'Fundamentos' && r.nivel === 1);
    const fundL2 = rows.find(r => r.control === 'Fundamentos' && r.nivel === 2);
    assert.ok(fundL1, 'Fundamentos L1 should exist in DB');
    assert.equal(fundL1.unlocked, true);
    assert.ok(fundL2, 'Fundamentos L2 should exist in DB');
    assert.equal(fundL2.unlocked, false);
  });

  it('nivel 2 and 3 cells for geometric controls exist (10 rows)', async () => {
    const rows = await store.loadState('adrian');
    const geoControls = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
    const higher = rows.filter(r => r.nivel > 1 && geoControls.includes(r.control));
    assert.equal(higher.length, 10);
  });

  it('saveState updates attempts and correct_streak', async () => {
    const rows = await store.loadState('adrian');
    const first = rows[0];
    const newAttempts = first.attempts + 1;
    const newStreak = first.correct_streak + 1;

    await store.saveState('adrian', first.control, first.nivel, {
      attempts: newAttempts,
      correct_streak: newStreak,
      mastered: false,
      unlocked: first.unlocked,
    });

    const updated = await store.loadState('adrian');
    const cell = updated.find(r => r.control === first.control && r.nivel === first.nivel);
    assert.equal(cell.attempts, newAttempts);
    assert.equal(cell.correct_streak, newStreak);

    await store.saveState('adrian', first.control, first.nivel, {
      attempts: first.attempts,
      correct_streak: first.correct_streak,
      mastered: first.mastered,
      unlocked: first.unlocked,
    });
  });
});
