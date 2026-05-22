const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getInitialState,
  processAnswer,
  checkMastery,
  computeUnlocks,
} = require('../src/knowledge-state-engine');
const domain = require('../src/domain');

describe('domain', () => {
  it('exports GEOMETRIC_CONTROLS with 5 controls', () => {
    assert.deepEqual(domain.GEOMETRIC_CONTROLS, ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad']);
  });

  it('exports PREREQUISITE as Fundamentos', () => {
    assert.equal(domain.PREREQUISITE, 'Fundamentos');
  });

  it('exports ALL_CONTROLS with 6 elements (Fundamentos + 5 controls)', () => {
    assert.equal(domain.ALL_CONTROLS.length, 6);
    assert.equal(domain.ALL_CONTROLS[0], 'Fundamentos');
  });

  it('exports USER_ID as adrian', () => {
    assert.equal(domain.USER_ID, 'adrian');
  });
});

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

  describe('computeUnlocks', () => {
    it('L1 dominated geometric control returns nextNivel:2 fanOut:[]', () => {
      let state = getInitialState();
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Planicidad', 1, true);
      }
      assert.deepEqual(computeUnlocks(state, 'Planicidad', 1), { nextNivel: 2, fanOut: [] });
    });

    it('L2 dominated geometric control returns nextNivel:3 fanOut:[]', () => {
      let state = getInitialState();
      state['Planicidad'][2].unlocked = true;
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Planicidad', 2, true);
      }
      assert.deepEqual(computeUnlocks(state, 'Planicidad', 2), { nextNivel: 3, fanOut: [] });
    });

    it('L3 dominated geometric control returns nextNivel:null fanOut:[]', () => {
      let state = getInitialState();
      state['Planicidad'][3].unlocked = true;
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Planicidad', 3, true);
      }
      assert.deepEqual(computeUnlocks(state, 'Planicidad', 3), { nextNivel: null, fanOut: [] });
    });

    it('L1 NOT dominated geometric control returns nextNivel:null fanOut:[]', () => {
      let state = getInitialState();
      for (let i = 0; i < 3; i++) {
        state = processAnswer(state, 'Planicidad', 1, true);
      }
      assert.deepEqual(computeUnlocks(state, 'Planicidad', 1), { nextNivel: null, fanOut: [] });
    });

    it('Fundamentos L2 dominated returns nextNivel:null fanOut:[5 controls]', () => {
      const state = getInitialState();
      state['Fundamentos'][2].mastered = true;
      const result = computeUnlocks(state, 'Fundamentos', 2);
      assert.equal(result.nextNivel, null);
      assert.deepEqual(result.fanOut.sort(), ['Cilindricidad', 'Paralelismo', 'Perpendicularidad', 'Planicidad', 'Posicion'].sort());
    });

    it('Fundamentos L2 NOT dominated returns nextNivel:null fanOut:[]', () => {
      const state = getInitialState();
      state['Fundamentos'][2].mastered = false;
      assert.deepEqual(computeUnlocks(state, 'Fundamentos', 2), { nextNivel: null, fanOut: [] });
    });

    it('Fundamentos L1 dominated returns nextNivel:2 fanOut:[]', () => {
      let state = getInitialState();
      for (let i = 0; i < 4; i++) {
        state = processAnswer(state, 'Fundamentos', 1, true);
      }
      assert.deepEqual(computeUnlocks(state, 'Fundamentos', 1), { nextNivel: 2, fanOut: [] });
    });
  });
});
