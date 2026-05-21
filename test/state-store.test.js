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

  it('loadState returns 15 rows for user adrian', async () => {
    const rows = await store.loadState('adrian');
    assert.equal(rows.length, 15);
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

  it('nivel 1 cells are unlocked for all controls', async () => {
    const rows = await store.loadState('adrian');
    const nivel1 = rows.filter(r => r.nivel === 1);
    assert.equal(nivel1.length, 5);
    nivel1.forEach(r => assert.equal(r.unlocked, true));
  });

  it('nivel 2 and 3 cells are locked initially', async () => {
    const rows = await store.loadState('adrian');
    const locked = rows.filter(r => r.nivel > 1);
    assert.equal(locked.length, 10);
    locked.forEach(r => assert.equal(r.unlocked, false));
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
