const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getInitialState,
  processAnswer,
  checkMastery,
  shouldUnlockNext,
  getFanOutControls,
} = require('../src/knowledge-state-engine');

describe('KnowledgeStateEngine', () => {
  describe('getInitialState', () => {
    it('returns state with all 5 geometric controls present', () => {
      const state = getInitialState();
      const controls = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
      controls.forEach(control => {
        assert.ok(state[control], `missing control ${control}`);
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

  describe('Fundamentos', () => {
    it('getInitialState has Fundamentos L1 unlocked', () => {
      const state = getInitialState();
      assert.ok(state['Fundamentos'], 'Fundamentos control should exist');
      assert.equal(state['Fundamentos'][1].unlocked, true, 'Fundamentos L1 should be unlocked');
    });

    it('getInitialState has Fundamentos L2 locked', () => {
      const state = getInitialState();
      assert.equal(state['Fundamentos'][2].unlocked, false, 'Fundamentos L2 should be locked');
    });

    it('getInitialState has no Fundamentos L3', () => {
      const state = getInitialState();
      assert.equal(state['Fundamentos'][3], undefined, 'Fundamentos should not have L3');
    });

    it('getInitialState returns 17 total cells (Fundamentos x2 + 5 controls x3)', () => {
      const state = getInitialState();
      let count = 0;
      Object.values(state).forEach(niveles => {
        count += Object.keys(niveles).length;
      });
      assert.equal(count, 17);
    });

    it('getInitialState has 5 geometric controls L1 locked (Fundamentos is prerequisite)', () => {
      const state = getInitialState();
      const controls = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
      controls.forEach(control => {
        assert.equal(state[control][1].unlocked, false, `${control} L1 should be locked until Fundamentos is mastered`);
      });
    });
  });

  describe('getFanOutControls', () => {
    it('returns 5 geometric controls when Fundamentos L2 is mastered', () => {
      const state = getInitialState();
      state['Fundamentos'][2].mastered = true;
      const fanOut = getFanOutControls(state, 'Fundamentos', 2);
      assert.deepEqual(fanOut.sort(), ['Cilindricidad', 'Paralelismo', 'Perpendicularidad', 'Planicidad', 'Posicion'].sort());
    });

    it('returns empty array when Fundamentos L2 is not mastered', () => {
      const state = getInitialState();
      state['Fundamentos'][2].mastered = false;
      const fanOut = getFanOutControls(state, 'Fundamentos', 2);
      assert.deepEqual(fanOut, []);
    });

    it('returns empty array for non-Fundamentos control', () => {
      const state = getInitialState();
      state['Planicidad'][1].mastered = true;
      const fanOut = getFanOutControls(state, 'Planicidad', 1);
      assert.deepEqual(fanOut, []);
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
