require('dotenv').config();
const { Pool } = require('pg');
const { generateForControl } = require('./exercise-generator');
const { evaluate } = require('./answer-evaluator');
const { processAnswer, shouldUnlockNext } = require('./knowledge-state-engine');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const USER_ID = 'adrian';

async function loadKnowledgeState() {
  const { rows } = await pool.query(
    'SELECT control, nivel, attempts, correct_streak, mastered, unlocked FROM knowledge_state WHERE user_id = $1',
    [USER_ID]
  );
  const state = {};
  rows.forEach(r => {
    if (!state[r.control]) state[r.control] = {};
    state[r.control][r.nivel] = {
      attempts: r.attempts,
      correct_streak: r.correct_streak,
      mastered: r.mastered,
      unlocked: r.unlocked,
    };
  });
  return state;
}

async function saveCell(control, nivel, cell) {
  await pool.query(
    `UPDATE knowledge_state
     SET attempts = $4, correct_streak = $5, mastered = $6, unlocked = $7, updated_at = NOW()
     WHERE user_id = $1 AND control = $2 AND nivel = $3`,
    [USER_ID, control, nivel, cell.attempts, cell.correct_streak, cell.mastered, cell.unlocked]
  );
}

async function nextExercise(control, nivel) {
  return generateForControl(control, nivel);
}

async function submitAnswer(exerciseId, answerIndex, exerciseData) {
  const { control, nivel } = exerciseData;
  const result = evaluate(exerciseData, answerIndex);

  const state = await loadKnowledgeState();
  const newState = processAnswer(state, control, nivel, result.correct);

  await saveCell(control, nivel, newState[control][nivel]);

  if (shouldUnlockNext(newState, control, nivel)) {
    const nextNivel = nivel + 1;
    if (newState[control][nextNivel]) {
      newState[control][nextNivel].unlocked = true;
      await saveCell(control, nextNivel, newState[control][nextNivel]);
    }
  }

  return { result, newState };
}

module.exports = { nextExercise, submitAnswer };
