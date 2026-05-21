const CONTROLS = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
const LEVELS = [1, 2, 3];
const MASTERY_THRESHOLD = 4;

function getInitialState() {
  const state = {};
  state['Fundamentos'] = {
    1: { attempts: 0, correct_streak: 0, mastered: false, unlocked: true },
    2: { attempts: 0, correct_streak: 0, mastered: false, unlocked: false },
  };
  CONTROLS.forEach(control => {
    state[control] = {};
    LEVELS.forEach(nivel => {
      state[control][nivel] = {
        attempts: 0,
        correct_streak: 0,
        mastered: false,
        unlocked: false,
      };
    });
  });
  return state;
}

function checkMastery(cellState) {
  return cellState.correct_streak >= MASTERY_THRESHOLD;
}

function processAnswer(state, control, nivel, isCorrect) {
  const newState = JSON.parse(JSON.stringify(state));
  const cell = newState[control][nivel];
  cell.attempts += 1;
  if (isCorrect) {
    cell.correct_streak += 1;
  } else {
    cell.correct_streak = 0;
  }
  cell.mastered = checkMastery(cell);
  return newState;
}

function shouldUnlockNext(state, control, nivel) {
  const cell = state[control][nivel];
  if (!cell.mastered) return false;
  const nextNivel = nivel + 1;
  if (nextNivel > 3) return false;
  return true;
}

module.exports = { getInitialState, processAnswer, checkMastery, shouldUnlockNext };
