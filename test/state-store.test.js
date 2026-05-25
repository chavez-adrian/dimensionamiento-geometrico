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

  it('Fundamentos L1 and L2 exist in DB', async () => {
    const rows = await store.loadState('adrian');
    const fundL1 = rows.find(r => r.control === 'Fundamentos' && r.nivel === 1);
    const fundL2 = rows.find(r => r.control === 'Fundamentos' && r.nivel === 2);
    assert.ok(fundL1, 'Fundamentos L1 should exist in DB');
    assert.equal(fundL1.unlocked, true);
    assert.ok(fundL2, 'Fundamentos L2 should exist in DB');
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

  it('loadKnowledgeState returns a state map with Fundamentos and geometric controls', async () => {
    const state = await store.loadKnowledgeState('adrian');
    assert.ok(state['Fundamentos'], 'should have Fundamentos');
    assert.ok(state['Fundamentos'][1], 'should have Fundamentos L1');
    assert.ok(state['Planicidad'], 'should have Planicidad');
  });

  it('saveCell updates a specific cell in DB', async () => {
    const state = await store.loadKnowledgeState('adrian');
    const cell = state['Planicidad'][1];
    const origAttempts = cell.attempts;
    await store.saveCell('adrian', 'Planicidad', 1, { ...cell, attempts: origAttempts + 99 });
    const updated = await store.loadKnowledgeState('adrian');
    assert.equal(updated['Planicidad'][1].attempts, origAttempts + 99);
    await store.saveCell('adrian', 'Planicidad', 1, cell);
  });

  it('getSeenBankIds returns an array', async () => {
    const ids = await store.getSeenBankIds('adrian', 'Planicidad', 2);
    assert.ok(Array.isArray(ids));
  });

  it('getSeenQuestions returns an array of strings', async () => {
    const qs = await store.getSeenQuestions('adrian', 'Planicidad', 1);
    assert.ok(Array.isArray(qs));
    qs.forEach(q => assert.equal(typeof q, 'string'));
  });

  it('getUnseenNivel2 returns a row or null', async () => {
    const row = await store.getUnseenNivel2('Planicidad', 2, []);
    if (row !== null) {
      assert.ok(row.id);
      assert.ok(row.content);
    }
  });
});

describe('StateStore lesson methods', () => {
  let store;
  const TEST_USER = 'test-lesson-user';
  const TEST_LESSON = 'test-lesson-id';

  before(async () => {
    store = new StateStore(process.env.DATABASE_URL);
    await store.connect();
    await store.pool.query(
      'DELETE FROM lesson_completions WHERE user_id = $1',
      [TEST_USER]
    );
  });

  after(async () => {
    await store.pool.query(
      'DELETE FROM lesson_completions WHERE user_id = $1',
      [TEST_USER]
    );
    await store.disconnect();
  });

  it('isLessonCompleted returns false when no record exists', async () => {
    const result = await store.isLessonCompleted(TEST_USER, TEST_LESSON);
    assert.equal(result, false);
  });

  it('getCompletedLessons returns empty array initially', async () => {
    const lessons = await store.getCompletedLessons(TEST_USER);
    assert.ok(Array.isArray(lessons));
    assert.equal(lessons.length, 0);
  });

  it('completeLesson persists the completion', async () => {
    await store.completeLesson(TEST_USER, TEST_LESSON);
    const result = await store.isLessonCompleted(TEST_USER, TEST_LESSON);
    assert.equal(result, true);
  });

  it('completeLesson is idempotent', async () => {
    await store.completeLesson(TEST_USER, TEST_LESSON);
    await store.completeLesson(TEST_USER, TEST_LESSON);
    const lessons = await store.getCompletedLessons(TEST_USER);
    assert.equal(lessons.length, 1);
  });

  it('getCompletedLessons returns array of lesson_ids', async () => {
    const lessons = await store.getCompletedLessons(TEST_USER);
    assert.ok(Array.isArray(lessons));
    assert.ok(lessons.includes(TEST_LESSON));
    lessons.forEach(id => assert.equal(typeof id, 'string'));
  });
});
