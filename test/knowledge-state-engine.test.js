const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getInitialState,
  processAnswer,
  checkMastery,
  shouldUnlockNext,
} = require('../src/knowledge-state-engine');

describe('KnowledgeStateEngine', () => {
  describe('getInitialState', () => {
    it('returns state with nivel 1 unlocked for all controls', () => {
      const state = getInitialState();
      const controls = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
      controls.forEach(control => {
        assert.ok(state[control], `missing control ${control}`);
        assert.equal(state[control][1].unlocked, true, `nivel 1 should be unlocked for ${control}`);
      });
    });

    it('returns state with nivel 2 and 3 locked initially', () => {
      const state = getInitialState();
      const controls = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
      controls.forEach(control => {
        assert.equal(state[control][2].unlocked, false, `nivel 2 should be locked for ${control}`);
        assert.equal(state[control][3].unlocked, false, `nivel 3 should be locked for ${control}`);
      });
    });

    it('returns state with zero attempts and streak', () => {
      const state = getInitialState();
      assert.equal(state['Planicidad'][1].attempts, 0);
      assert.equal(state['Planicidad'][1].correct_streak, 0);
      assert.equal(state['Planicidad'][1].mastered, false);
    });
  });

  describe('checkMastery', () => {
    it('returns false when correct_streak is less than 4', () => {
      assert.equal(checkMastery({ correct_streak: 3, attempts: 3 }), false);
      assert.equal(checkMastery({ correct_streak: 0, attempts: 5 }), false);
      assert.equal(checkMastery({ correct_streak: 2, attempts: 2 }), false);
    });

    it('returns true exactly at correct_streak of 4', () => {
      assert.equal(checkMastery({ correct_streak: 4, attempts: 4 }), true);
    });

    it('returns true when correct_streak exceeds 4', () => {
      assert.equal(checkMastery({ correct_streak: 5, attempts: 5 }), true);
      assert.equal(checkMastery({ correct_streak: 10, attempts: 10 }), true);
    });
  });

  describe('processAnswer', () => {
    it('increments attempts on correct answer', () => {
      const state = getInitialState();
      const newState = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(newState['Planicidad'][1].attempts, 1);
    });

    it('increments attempts on incorrect answer', () => {
      const state = getInitialState();
      const newState = processAnswer(state, 'Planicidad', 1, false);
      assert.equal(newState['Planicidad'][1].attempts, 1);
    });

    it('increments correct_streak on correct answer', () => {
      const state = getInitialState();
      const newState = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(newState['Planicidad'][1].correct_streak, 1);
    });

    it('resets correct_streak to 0 on incorrect answer', () => {
      let state = getInitialState();
      state = processAnswer(state, 'Planicidad', 1, true);
      state = processAnswer(state, 'Planicidad', 1, true);
      state = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(state['Planicidad'][1].correct_streak, 3);
      state = processAnswer(state, 'Planicidad', 1, false);
      assert.equal(state['Planicidad'][1].correct_streak, 0);
    });

    it('resets correct_streak at position 1 (first answer wrong)', () => {
      let state = getInitialState();
      state = processAnswer(state, 'Planicidad', 1, false);
      assert.equal(state['Planicidad'][1].correct_streak, 0);
    });

    it('resets correct_streak at position 2 (second answer wrong)', () => {
      let state = getInitialState();
      state = processAnswer(state, 'Planicidad', 1, true);
      state = processAnswer(state, 'Planicidad', 1, false);
      assert.equal(state['Planicidad'][1].correct_streak, 0);
    });

    it('resets correct_streak at position 3 (third answer wrong)', () => {
      let state = getInitialState();
      state = processAnswer(state, 'Planicidad', 1, true);
      state = processAnswer(state, 'Planicidad', 1, true);
      state = processAnswer(state, 'Planicidad', 1, false);
      assert.equal(state['Planicidad'][1].correct_streak, 0);
    });

    it('mastery achieved exactly on 4th consecutive correct answer', () => {
      let state = getInitialState();
      state = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(state['Planicidad'][1].mastered, false);
      state = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(state['Planicidad'][1].mastered, false);
      state = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(state['Planicidad'][1].mastered, false);
      state = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(state['Planicidad'][1].mastered, true);
    });

    it('mastery not achieved with 3 correct answers', () => {
      let state = getInitialState();
      for (let i = 0; i < 3; i++) {
        state = processAnswer(state, 'Planicidad', 1, true);
      }
      assert.equal(state['Planicidad'][1].mastered, false);
    });

    it('does not mutate original state', () => {
      const state = getInitialState();
      const newState = processAnswer(state, 'Planicidad', 1, true);
      assert.equal(state['Planicidad'][1].attempts, 0);
      assert.equal(newState['Planicidad'][1].attempts, 1);
    });
  });

  describe('shouldUnlockNext', () => {
    it('nivel 2 is unlocked when nivel 1 is mastered', () => {
      let state = getInitialState();
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Planicidad', 1, true);
      }
      assert.equal(shouldUnlockNext(state, 'Planicidad', 1), true);
    });

    it('nivel 2 is not unlocked when nivel 1 is not mastered', () => {
      let state = getInitialState();
      for (let i = 0; i < 3; i++) {
        state = processAnswer(state, 'Planicidad', 1, true);
      }
      assert.equal(shouldUnlockNext(state, 'Planicidad', 1), false);
    });

    it('nivel 3 is NOT unlocked when only nivel 1 is mastered', () => {
      let state = getInitialState();
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Planicidad', 1, true);
      }
      assert.equal(shouldUnlockNext(state, 'Planicidad', 2), false);
    });

    it('nivel 3 is unlocked when nivel 2 is mastered', () => {
      let state = getInitialState();
      state['Planicidad'][2].unlocked = true;
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Planicidad', 2, true);
      }
      assert.equal(shouldUnlockNext(state, 'Planicidad', 2), true);
    });
  });
});
